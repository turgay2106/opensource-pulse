import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, toMarkdown } from '../src/pulse.js';

test('detects actionable maintenance findings', () => {
  const report = analyze({ issues: [{ number: 1, labels: [], stale: true }], pullRequests: [{ number: 2, state: 'open' }], checks: [{ name: 'tests', status: 'failure' }] });
  assert.deepEqual(report.summary, { issueCount: 1, openPullRequestCount: 1, staleIssueCount: 1, failingCheckCount: 1 });
  assert.equal(report.findings.length, 4);
});

test('renders a clean result when there are no findings', () => {
  const markdown = toMarkdown(analyze({ issues: [{ labels: ['bug'], stale: false }], pullRequests: [], checks: [] }));
  assert.match(markdown, /No maintenance findings/);
});
