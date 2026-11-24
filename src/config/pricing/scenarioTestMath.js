/**
 * scenarioTestMath — the credit model for PROMPT TESTING / scenario runs.
 *
 * The capacity meter for `scenario_runs`, the analogue of creditMath.js (web),
 * specTestMath (test design) and perfTestMath.js (load). Same CommonJS rule and
 * the same reason: Express requires it to charge, the React page imports it to
 * quote, and there is deliberately no second pricing implementation in the
 * Python engine to drift out of sync. That engine runs scenarios and reports
 * what it did; it prices nothing.
 *
 * WHICH PLANS THIS APPLIES TO
 * ---------------------------
 * BYOK only, per pricing.data.json `meters`, like every other capacity meter.
 * Managed runs bill from `modelRates` against reported tokens.
 *
 * WHY SCENARIO RUNS CAN BE QUOTED EXACTLY
 * ---------------------------------------
 * Every other meter has to guess the size of the work before it starts: how
 * many stories a URL will yield, how many requirements a document holds. A
 * scenario run is different — the customer submits the steps, so the work is
 * fully described up front, and a step of the form "Wait 3 minutes" states its
 * own cost. That makes the pre-run quote close to the settled figure instead of
 * an upper bound, and it is why the gate can hold an accurate amount.
 *
 * WHY NOT PER SCENARIO
 * --------------------
 * The shipped Ringi set ranges from a 2-step scenario (C6, open a list) to a
 * 27-step one (C1, create through to Approved). A flat per-scenario rate would
 * misprice those by roughly 13x in opposite directions. Steps are the unit that
 * actually tracks the work.
 *
 * THE MODEL
 * ---------
 *   billableSeconds = declaredWaitSeconds
 *                   + actionSteps * SECONDS_PER_ACTION_STEP(model)
 *                   + emailSteps  * SECONDS_PER_EMAIL_STEP
 *   credits         = max(1, round(billableSeconds / SECONDS_PER_CREDIT))
 *
 * Three components, because a scenario step is one of three different things:
 *
 *   - a declared wait ("Wait 2 minutes") holds the browser and the worker for a
 *     stated time and makes no model call. It is billed at what it declares,
 *     capped per step so a typo cannot drain an account.
 *
 *   - an ordinary action ("Click Add Ringi") is one planner call plus the work
 *     to find and drive the control.
 *
 *   - an e-mail approval ("As <account>, approve the email for X") signs a
 *     second account in, opens their mailbox and polls with reloads until the
 *     approval card arrives. It is far slower than a click and is priced
 *     separately rather than being averaged into the action rate.
 *
 * A run that did nothing still costs at least 1 credit: it signed in, opened a
 * real browser and held a worker. Mirrors creditsForStories(0) === 1.
 */

const PRICING = require("./pricing.data.json");

const P = PRICING.scenarioTestFormula;

function nonNegative(n) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/** Seconds charged for one ordinary action step on a given model. */
function secondsPerActionStep(model) {
  const byModel = P.SECONDS_PER_ACTION_STEP_BY_MODEL || {};
  const measured = model ? byModel[model] : undefined;
  // An unmeasured model must never be quoted optimistically - the default is
  // deliberately at or above every measured entry.
  return Number.isFinite(measured) ? measured : P.SECONDS_PER_ACTION_STEP_DEFAULT;
}

/**
 * Split a scenario block into the three kinds of step this meter prices.
 *
 * This reads the submitted text only well enough to COUNT work. It is not a
 * scenario parser and must not become one: the Python engine owns what a step
 * means, this owns only what it costs. The two things it recognises - a
 * numbered step, and a step that opens with "Wait <n> <unit>" - are the parts
 * of the format that carry a price.
 */
function countScenarioWork(scenariosText) {
  const text = String(scenariosText || "");
  const stepLine = /^\s*\d+[.)]\s*(.+)$/;
  const waitStep = /^wait\s+(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)\b/i;
  const emailStep = /^as\s+[A-Za-z0-9._@-]+\s*[,:]?\s*(approve|reject)\b/i;

  let actionSteps = 0;
  let emailSteps = 0;
  let declaredWaitSeconds = 0;
  let scenarios = 0;

  for (const raw of text.split(/\r?\n/)) {
    if (/^\s*SCENARIO\s*:/i.test(raw)) {
      scenarios += 1;
      continue;
    }
    const m = stepLine.exec(raw);
    if (!m) continue;
    const step = m[1].trim();

    const w = waitStep.exec(step);
    if (w) {
      const secs = Number(w[1]) * (/^m/i.test(w[2]) ? 60 : 1);
      declaredWaitSeconds += Math.min(secs, P.MAX_DECLARED_WAIT_SECONDS_PER_STEP);
      continue;
    }
    if (emailStep.test(step)) {
      emailSteps += 1;
      continue;
    }
    actionSteps += 1;
  }

  return {
    scenarios,
    actionSteps,
    emailSteps,
    declaredWaitSeconds,
    totalSteps: actionSteps + emailSteps,
  };
}

/** Duration-equivalent seconds a scenario run is charged for. */
function billableSeconds({ actionSteps, emailSteps, declaredWaitSeconds, model }) {
  const action = nonNegative(actionSteps) * secondsPerActionStep(model);
  const email = nonNegative(emailSteps) * P.SECONDS_PER_EMAIL_STEP;
  const waited = nonNegative(declaredWaitSeconds);
  return action + email + waited;
}

/** True when a run asks for more steps than one run is allowed to hold. */
function isOversized(totalSteps) {
  return nonNegative(totalSteps) > P.MAX_STEPS_PER_RUN;
}

/**
 * Credits charged for one scenario run.
 *
 * Takes counts, not text, so it can price a run that has already finished from
 * what the engine reported, as well as one that has not started yet.
 */
function creditsForScenarioRun({ actionSteps, emailSteps, declaredWaitSeconds, model }) {
  const seconds = billableSeconds({ actionSteps, emailSteps, declaredWaitSeconds, model });
  return Math.max(1, Math.round(seconds / P.SECONDS_PER_CREDIT));
}

/**
 * Quote a run from the scenarios the customer submitted, before it starts.
 *
 * The returned shape matches what the other estimate endpoints hand the gate:
 * a credit figure, the working behind it, and whether the run is too large to
 * authorise without an explicit acknowledgement.
 */
function estimateScenarioRun(scenariosText, { model } = {}) {
  const work = countScenarioWork(scenariosText);
  const seconds = billableSeconds({ ...work, model });
  return {
    scenarios: work.scenarios,
    totalSteps: work.totalSteps,
    actionSteps: work.actionSteps,
    emailSteps: work.emailSteps,
    declaredWaitSeconds: work.declaredWaitSeconds,
    secondsPerActionStep: secondsPerActionStep(model),
    billableSeconds: seconds,
    credits: Math.max(1, Math.round(seconds / P.SECONDS_PER_CREDIT)),
    oversized: isOversized(work.totalSteps),
    maxStepsPerRun: P.MAX_STEPS_PER_RUN,
  };
}

module.exports = {
  countScenarioWork,
  secondsPerActionStep,
  billableSeconds,
  creditsForScenarioRun,
  estimateScenarioRun,
  isOversized,
};
