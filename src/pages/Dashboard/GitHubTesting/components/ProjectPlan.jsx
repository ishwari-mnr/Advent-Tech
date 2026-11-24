import React, { useEffect, useState } from 'react';
import { FolderTree, AlertTriangle, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';

/**
 * What we detected in the repo, shown BEFORE the run starts.
 *
 * Detection is a guess about someone else's project, and the guess that cost a
 * real run its results was "the app is at the repo root" — it was in
 * frontend/, so npm installed nothing and the tests could not run. The user
 * knows that layout instantly; we cannot. So the plan is shown here, where
 * correcting it is free, instead of being discovered from an empty Results tab
 * afterwards.
 *
 * Read-only for now: it tells the user what will happen. Editing a workspace
 * root is the natural next step and is why the backend stores workspaces as a
 * list rather than a single root.
 */
export default function ProjectPlan({ repoId }) {
  const [plan, setPlan] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/repos/${repoId}/plan`);
        if (!cancelled) setPlan(data);
      } catch {
        // Never block the run on this panel — it is guidance, not a gate.
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repoId]);

  if (failed) return null;

  if (!plan) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 px-4 py-3 border-b">
        <Loader2 className="animate-spin" size={13} /> Working out what's in this project…
      </div>
    );
  }

  const testable = new Set(plan.testGenerationLanguages || []);
  const workspaces = plan.workspaces || [];

  // Languages present in the repo that will be read but never tested — the
  // Kotlin case, where a full analysis is paid for and no test can follow.
  const analysisOnly = [
    ...new Set(
      workspaces.flatMap((w) => (w.languages || []).filter((l) => !testable.has(l))),
    ),
  ];

  if (workspaces.length === 0) {
    return (
      <div className="px-4 py-3 border-b bg-amber-50 text-xs text-amber-900 flex gap-2">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          We couldn't find a project to build here — no <code>package.json</code>,{' '}
          <code>pom.xml</code>, <code>build.gradle</code> or{' '}
          <code>requirements.txt</code>. Your code will still be analysed, but no
          tests can be run.
        </span>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b bg-gray-50">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
        <FolderTree size={13} /> What we found
      </div>

      <ul className="space-y-1">
        {workspaces.map((w) => (
          <li key={w.root || '.'} className="text-xs text-gray-600 flex items-baseline gap-2">
            <code className="text-gray-800">{w.root || '/'}</code>
            <span className="text-gray-400">
              {(w.languages || []).length ? w.languages.join(', ') : 'no build file'}
            </span>
            {(w.languages || []).some((l) => testable.has(l)) && (
              <span className="text-emerald-600">tests will run</span>
            )}
          </li>
        ))}
      </ul>

      {analysisOnly.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium text-gray-700">{analysisOnly.join(', ')}</span> will be
          analysed for issues, but we can't generate tests for it yet.
        </p>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Wrong? Your app may live in a subfolder we didn't spot — check the paths above before
        starting.
      </p>
    </div>
  );
}
