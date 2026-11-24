const mongoose = require("mongoose");

/**
 * ScenarioRun — one document per prompt-testing / scenario run.
 *
 * WRITTEN BY EXPRESS AT THE GATE, UPDATED BY THE PYTHON WEB-TESTING ENGINE,
 * BILLED BY THE RECONCILER. This is the prompt-testing analogue of
 * SpecTestRun (test design), VaptRun (security) and `test_count` on
 * ApiTestRun.
 *
 * WHY EXPRESS CREATES THE ROW RATHER THAN THE ENGINE
 * --------------------------------------------------
 * Unlike spec testing, a scenario run has no discovery phase to reserve
 * against: the customer hands over the steps and the run starts. So the row is
 * created by authorize-scenario-run, which claims ownership of the run_id in
 * the same write that holds the credits - the pattern authorizeVaptRun uses.
 * The engine then fills in what actually happened.
 *
 * Both services sit on the same `AI-Tester` database, so Express reads the
 * engine's own numbers first-hand rather than trusting a figure relayed
 * through the browser. That matters more here than anywhere else: the engine
 * is unauthenticated and the browser posts to `/scenarios/run/{id}` directly,
 * so anything the browser asserted could be forged.
 *
 * THE COST DRIVERS
 * ----------------
 * A scenario step is one of three things, priced differently - see
 * src/config/pricing/scenarioTestMath.js:
 *
 *   - a declared wait ("Wait 2 minutes") holds a worker for a stated time and
 *     makes no model call
 *   - an ordinary action ("Click Add Ringi") is one planner call plus the work
 *     to find and drive the control
 *   - an e-mail approval ("As <account>, approve the email for X") signs a
 *     second account in and polls a mailbox for up to twelve minutes
 *
 * Quoted counts come from the submitted text; settled counts come from what
 * the engine reports here, so a run that stops at step 2 of 27 is not charged
 * as though it finished.
 */

const scenarioRunSchema = new mongoose.Schema(
  {
    run_id: { type: String, required: true, unique: true, index: true },

    // Asserted by the caller at the gate and verified against the token there.
    // The engine writes it as a string; Express resolves company from it.
    user_id: { type: String, required: true, index: true },

    // Marks which engine produced the row, so a future second writer to this
    // collection cannot be billed by the wrong meter.
    source: { type: String, default: "prompt_testing", index: true },

    // The saved sign-in the run drove, and the site it ran against. Recorded
    // for support and for the ledger note, never for pricing.
    parent_session: { type: String, default: null, index: true },
    target_url: { type: String, default: null },

    /* ------------------- what was quoted at the gate --------------------- */

    // Counted from the submitted scenario text before the run started. Kept so
    // a gate-to-settlement gap can be explained without re-parsing anything -
    // that gap is how specTestFormula was found to be under-quoting.
    quoted_scenarios: { type: Number, default: null },
    quoted_action_steps: { type: Number, default: null },
    quoted_email_steps: { type: Number, default: null },
    quoted_wait_seconds: { type: Number, default: null },
    quoted_billable_seconds: { type: Number, default: null },

    /* ------------------- the integers we settle from --------------------- */

    // What the engine actually did. Steps it never reached are not charged.
    scenarios_run: { type: Number, default: null },
    action_steps: { type: Number, default: null },
    email_steps: { type: Number, default: null },
    wait_seconds: { type: Number, default: null },

    scenarios_passed: { type: Number, default: null },
    scenarios_failed: { type: Number, default: null },

    /* ---------------- calibration inputs (written by Python) ------------- */

    // BYOK plans are metered on how long a run occupies a worker, and that
    // rate differs by model - so the rate must be MEASURED per model rather
    // than modelled once. These are what scripts/calibrate_rates.py derives
    // SECONDS_PER_ACTION_STEP from, and what will replace the provisional
    // single-run figure currently in scenarioTestFormula.
    //
    // `model` is the model that ACTUALLY ran, from the engine's own call
    // tally: a run that rate-limits on OpenAI and completes on Anthropic must
    // be priced as Anthropic, not as what the customer's keys implied.
    model: { type: String, default: null, index: true },
    model_calls: { type: Object, default: null },

    // Wall clock, and the part of it the scenarios asked for themselves. The
    // difference is what the per-step rates are calibrated against.
    total_duration_ms: { type: Number, default: null },
    declared_wait_ms: { type: Number, default: null },
    seconds_per_action_step: { type: Number, default: null },

    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    error: { type: String, default: null },

    /* ------------------- delivery state --------------------------------- */

    s3_key: { type: String, default: null },
    s3_download_url: { type: String, default: null },

    /* ---------------- authorization (Express owns these) ----------------- */

    // The gate. Express sets these when it has held credits for the run, and
    // THE ENGINE MUST READ THEM before starting work - it is unauthenticated
    // and the browser posts to it directly, so the decision cannot travel in
    // the request. It has to come through the database, where only Express can
    // have written it.
    //
    // These must stay declared here: mongoose runs strict by default and
    // SILENTLY DROPS unknown fields from an update, so an undeclared flag
    // would make authorize-scenario-run report success while writing nothing,
    // and every run would then be refused.
    authorized: { type: Boolean, default: false, index: true },
    authorized_credits: { type: Number, default: null },
    authorized_at: { type: Date, default: null },
    authorization_id: { type: mongoose.Schema.Types.ObjectId, default: null },

    /* ---------------- billing state (Express owns these) ---------------- */

    billed: { type: Boolean, default: false, index: true },

    // Claimed BEFORE the debit is applied, so a crash mid-billing strands the
    // row visibly instead of letting a second pass charge it again.
    claimToken: { type: String, default: null, index: true },
    claimedAt: { type: Date, default: null },

    billedAt: { type: Date, default: null },
    chargedCredits: { type: Number, default: null },
    // Why nothing was charged, when nothing was: "managed" (billed on tokens
    // instead), "no_subscription", "unattributed".
    skippedReason: { type: String, default: null },

    created_at: { type: String, default: null },
    finished_at: { type: String, default: null },
  },
  { collection: "scenario_run", timestamps: false }
);

// The reconciler's hot path: terminal runs that have not been billed yet.
scenarioRunSchema.index({ billed: 1, claimToken: 1, status: 1 });

module.exports = mongoose.model("ScenarioRun", scenarioRunSchema, "scenario_run");
