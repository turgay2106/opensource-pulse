export function analyze(payload = {}) {
  const issues = Array.isArray(payload.issues) ? payload.issues : [];
  const pullRequests = Array.isArray(payload.pullRequests) ? payload.pullRequests : [];
  const checks = Array.isArray(payload.checks) ? payload.checks : [];
  const missingLabels = issues.filter((issue) => !Array.isArray(issue.labels) || issue.labels.length === 0);
  const staleIssues = issues.filter((issue) => issue.stale === true);
  const openPRs = pullRequests.filter((pr) => pr.state === 'open');
  const failingChecks = checks.filter((check) => check.status === 'failure' || check.conclusion === 'failure');
  return {
    summary: { issueCount: issues.length, openPullRequestCount: openPRs.length, staleIssueCount: staleIssues.length, failingCheckCount: failingChecks.length },
    findings: [
      ...missingLabels.map((i) => ({ type: 'issue-label', severity: 'medium', title: `Issue #${i.number ?? '?'} has no labels`, detail: 'Add a label so maintainers can triage it consistently.' })),
      ...staleIssues.map((i) => ({ type: 'stale-issue', severity: 'low', title: `Issue #${i.number ?? '?'} may be stale`, detail: 'Confirm whether the issue is still reproducible or close it with context.' })),
      ...openPRs.map((pr) => ({ type: 'open-pr', severity: 'info', title: `PR #${pr.number ?? '?'} is awaiting maintenance`, detail: 'Review checks, requested changes, and merge readiness.' })),
      ...failingChecks.map((c) => ({ type: 'failing-check', severity: 'high', title: `Check ${c.name ?? 'unnamed'} is failing`, detail: 'Investigate the failing check before releasing or merging.' }))
    ]
  };
}

export function toMarkdown(report, title = 'OpenSource Pulse report') {
  const { summary, findings } = report;
  const lines = [`# ${title}`, '', `- Issues scanned: **${summary.issueCount}**`, `- Open pull requests: **${summary.openPullRequestCount}**`, `- Stale issues: **${summary.staleIssueCount}**`, `- Failing checks: **${summary.failingCheckCount}**`, ''];
  if (!findings.length) return lines.concat(['## Result', '', 'No maintenance findings were detected.']).join('\n') + '\n';
  lines.push('## Findings', '');
  for (const finding of findings) lines.push(`- **${finding.severity}** — ${finding.title}: ${finding.detail}`);
  return lines.join('\n') + '\n';
}
