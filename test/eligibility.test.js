import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeContributions, evaluatePrograms, renderReport } from '../src/eligibility.js';

const now = new Date('2026-11-19T12:00:00Z');
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

const prs = [
  { repo: 'nodejs/node', mergedAt: daysAgo(3) },
  { repo: 'nodejs/node', mergedAt: daysAgo(10) },
  { repo: 'django/django', mergedAt: daysAgo(20) },
  { repo: 'alice/own-tool', mergedAt: daysAgo(5) }, // own repo: excluded
  { repo: 'expressjs/express', mergedAt: daysAgo(400) } // outside window
];

test('counts only merged PRs to repos the user does not own, within 12 months', () => {
  const c = analyzeContributions(prs, { username: 'Alice', now });
  assert.equal(c.totalMerged, 4);
  assert.equal(c.externalMerged, 3);
  assert.equal(c.ownRepoMerged, 1);
  assert.deepEqual(c.byRepo[0], { repo: 'nodejs/node', count: 2 });
  assert.equal(c.remaining, 97);
});

test('tracks weekly consistency for the last 12 weeks', () => {
  const c = analyzeContributions(prs, { username: 'alice', now });
  assert.equal(c.weeks.length, 12);
  assert.equal(c.weeks[11], 1); // 3 days ago
  assert.equal(c.weeks[10], 1); // 10 days ago
  assert.equal(c.activeWeeks, 3);
  assert.ok(c.weeksToTarget > 0);
});

test('reaching 100 external merged PRs marks active contributor as met', () => {
  const many = Array.from({ length: 100 }, (_, i) => ({ repo: 'rust-lang/rust', mergedAt: daysAgo(i % 300) }));
  const c = analyzeContributions(many, { username: 'bob', now });
  const p = evaluatePrograms(c);
  assert.equal(c.remaining, 0);
  assert.equal(p.claude[0].status, 'met');
  assert.equal(p.claudeEligible, true);
});

test('repository data enables maintainer, community and Codex checks', () => {
  const c = analyzeContributions([], { username: 'carol', now });
  const p = evaluatePrograms(c, { fullName: 'carol/lib', stars: 900, monthlyDownloads: 250000, externalContributors: 12, releasesLastYear: 4, role: 'primary' });
  assert.equal(p.claude[1].status, 'met');
  assert.equal(p.claude[2].status, 'not-met');
  assert.equal(p.codexReady, true);
});

test('unknown data is reported as unknown, not as failure', () => {
  const p = evaluatePrograms(analyzeContributions([], { username: 'dave', now }));
  assert.equal(p.claude[1].status, 'unknown');
  assert.equal(p.codexSignals.length, 0);
});

test('report fills form templates with real numbers', () => {
  const c = analyzeContributions(prs, { username: 'alice', now });
  const md = renderReport(c, evaluatePrograms(c), null, { handle: '@alice' });
  assert.match(md, /3 pull requests merged into repositories I do not own/);
  assert.match(md, /nodejs\/node \(2\)/);
  assert.match(md, /author%3Aalice/);
  assert.match(md, /\[REPO\]/);
});

test('username is required', () => {
  assert.throws(() => analyzeContributions([]), /username/);
});
