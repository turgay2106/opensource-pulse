// Contribution eligibility analysis for open-source AI programs
// (Claude for Open Source, Codex for Open Source).
// Pure functions only: no network, no file system. See github.js for fetching.

export const THRESHOLDS = Object.freeze({
  activeContributorMergedPRs: 100, // merged PRs to repos you do not own, last 12 months
  communityExternalContributors: 20, // distinct external contributors with merged PRs, last 12 months
  libraryDependentRepos: 500,
  libraryDependentPackages: 100,
  libraryMonthlyDownloads: 200000,
  criticalityScore: 0.4
});

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

export function windowStart(now = new Date(), months = 12) {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

function ownerOf(repo = '') {
  return String(repo).split('/')[0].toLowerCase();
}

/**
 * @param {Array<{repo: string, number?: number, title?: string, mergedAt: string, url?: string}>} pullRequests
 * @param {{username: string, now?: Date, ownedOwners?: string[]}} options
 */
export function analyzeContributions(pullRequests = [], { username, now = new Date(), ownedOwners = [] } = {}) {
  if (!username) throw new Error('username is required');
  const since = windowStart(now);
  const owners = new Set([username, ...ownedOwners].map((o) => o.toLowerCase()));

  const inWindow = pullRequests.filter((pr) => {
    const t = Date.parse(pr.mergedAt);
    return Number.isFinite(t) && t >= since.getTime() && t <= now.getTime();
  });
  const external = inWindow.filter((pr) => !owners.has(ownerOf(pr.repo)));

  const repoCounts = new Map();
  for (const pr of external) repoCounts.set(pr.repo, (repoCounts.get(pr.repo) || 0) + 1);
  const byRepo = [...repoCounts.entries()]
    .map(([repo, count]) => ({ repo, count }))
    .sort((a, b) => b.count - a.count || a.repo.localeCompare(b.repo));

  // Weekly buckets for the last 12 weeks (index 0 = oldest).
  const weeks = Array.from({ length: 12 }, () => 0);
  for (const pr of external) {
    const age = now.getTime() - Date.parse(pr.mergedAt);
    const idx = 11 - Math.floor(age / WEEK);
    if (idx >= 0 && idx < 12) weeks[idx] += 1;
  }
  const activeWeeks = weeks.filter((w) => w > 0).length;

  const target = THRESHOLDS.activeContributorMergedPRs;
  const remaining = Math.max(0, target - external.length);
  const recentPerWeek = weeks.reduce((a, b) => a + b, 0) / 12;
  const weeksToTarget = remaining === 0 ? 0 : recentPerWeek > 0 ? Math.ceil(remaining / recentPerWeek) : null;

  return {
    username,
    since: since.toISOString().slice(0, 10),
    until: now.toISOString().slice(0, 10),
    totalMerged: inWindow.length,
    externalMerged: external.length,
    ownRepoMerged: inWindow.length - external.length,
    byRepo,
    weeks,
    activeWeeks,
    recentPerWeek: Math.round(recentPerWeek * 10) / 10,
    target,
    remaining,
    progress: Math.min(1, external.length / target),
    weeksToTarget
  };
}

/**
 * Evaluate Claude for OSS groups and Codex for OSS signals.
 * Unknown inputs yield status "unknown" instead of guessing.
 * @param {ReturnType<typeof analyzeContributions>} contrib
 * @param {object} [repo] optional data about a repository you maintain
 */
export function evaluatePrograms(contrib, repo = null) {
  const status = (value, threshold) => (value == null ? 'unknown' : value >= threshold ? 'met' : 'not-met');
  const r = repo || {};

  const libraryChecks = [
    status(r.dependentRepos, THRESHOLDS.libraryDependentRepos),
    status(r.dependentPackages, THRESHOLDS.libraryDependentPackages),
    status(r.monthlyDownloads, THRESHOLDS.libraryMonthlyDownloads)
  ];
  const library = libraryChecks.includes('met') ? 'met' : libraryChecks.every((s) => s === 'unknown') ? 'unknown' : 'not-met';

  const claude = [
    { group: 'Aktif katkıcı (Active contributor)', status: status(contrib.externalMerged, THRESHOLDS.activeContributorMergedPRs), detail: `${contrib.externalMerged}/${THRESHOLDS.activeContributorMergedPRs} merged PR (sahibi olmadığın repolar, son 12 ay)` },
    { group: 'Kütüphane sahibi / bakımcı (Maintainer)', status: repo ? library : 'unknown', detail: repo ? `bağımlı repo: ${r.dependentRepos ?? '?'}, bağımlı paket: ${r.dependentPackages ?? '?'}, aylık indirme: ${r.monthlyDownloads ?? '?'}` : 'Repo bilgisi verilmedi (--repo)' },
    { group: 'Topluluk kurucusu (Community builder)', status: repo ? status(r.externalContributors, THRESHOLDS.communityExternalContributors) : 'unknown', detail: repo ? `${r.externalContributors ?? '?'}/${THRESHOLDS.communityExternalContributors} farklı dış katkıcı (son 12 ay)` : 'Repo bilgisi verilmedi (--repo)' },
    { group: 'Kritik altyapı (Critical infrastructure)', status: repo ? status(r.criticalityScore, THRESHOLDS.criticalityScore) : 'unknown', detail: `OpenSSF criticality skoru: ${r.criticalityScore ?? '?'} (eşik ${THRESHOLDS.criticalityScore})` },
    { group: 'Çekirdek katkıcı (Core committer)', status: r.coreCommitter === true ? 'met' : 'unknown', detail: 'Büyük projelerde listelenmiş committer/maintainer olmak — manuel kontrol' }
  ];

  const codexSignals = repo
    ? [
        { signal: 'Public repo', ok: r.isPublic !== false },
        { signal: 'Primary/core maintainer rolü', ok: Boolean(r.role) },
        { signal: 'Kullanım (star / indirme / bağımlı)', ok: (r.stars || 0) > 0 || (r.monthlyDownloads || 0) > 0 || (r.dependentRepos || 0) > 0 },
        { signal: 'Aktif bakım kanıtı (release / dış PR)', ok: (r.releasesLastYear || 0) > 0 || (r.externalContributors || 0) > 0 }
      ]
    : [];

  return {
    claude,
    claudeEligible: claude.some((g) => g.status === 'met'),
    codexSignals,
    codexReady: codexSignals.length > 0 && codexSignals.every((s) => s.ok)
  };
}

const ICON = { met: '✅', 'not-met': '❌', unknown: '❔' };
const fill = (value, placeholder) => (value == null || value === '' ? `[${placeholder}]` : String(value));

function bar(progress, width = 20) {
  const n = Math.round(progress * width);
  return '█'.repeat(n) + '░'.repeat(width - n);
}

export function renderReport(contrib, programs, repo = null, extra = {}) {
  const r = repo || {};
  const top = contrib.byRepo.slice(0, 3);
  const projectList = top.length
    ? top.map((p) => `${p.repo} (${p.count})`).join(', ')
    : '[project A] ([N]), [project B] ([N])';
  const pullsUrl = `https://github.com/pulls?q=is%3Apr+author%3A${encodeURIComponent(contrib.username)}+is%3Amerged`;

  const lines = [
    `# OSS uygunluk raporu — @${contrib.username}`,
    '',
    `Dönem: **${contrib.since} → ${contrib.until}** (son 12 ay)`,
    '',
    '## Katkı özeti',
    '',
    `- Sahibi olmadığın repolara merge edilen PR: **${contrib.externalMerged}**`,
    `- Kendi repolarına merge edilen PR (sayılmaz): ${contrib.ownRepoMerged}`,
    `- Hedef (aktif katkıcı): ${contrib.target} → \`${bar(contrib.progress)}\` %${Math.round(contrib.progress * 100)}`,
    `- Son 12 haftada aktif hafta: **${contrib.activeWeeks}/12**, ortalama ${contrib.recentPerWeek} PR/hafta`,
    contrib.remaining === 0
      ? '- 🎉 Aktif katkıcı eşiğini geçtin.'
      : contrib.weeksToTarget == null
        ? `- Kalan: ${contrib.remaining} PR. Son 12 haftada katkı yok; düzenli bir ritim başlat (haftada ~2 PR).`
        : `- Kalan: ${contrib.remaining} PR. Bu hızla yaklaşık **${contrib.weeksToTarget} hafta** sürer.`,
    '',
    `Haftalık dağılım (eski → yeni): \`${contrib.weeks.join(' ')}\``,
    ''
  ];

  if (contrib.byRepo.length) {
    lines.push('### Repo bazında', '', '| Repo | Merged PR |', '| --- | ---: |');
    for (const p of contrib.byRepo.slice(0, 15)) lines.push(`| ${p.repo} | ${p.count} |`);
    lines.push('');
  }

  lines.push('## Claude for Open Source', '', 'Beş gruptan **birini** karşılamak yeterli. Kriterlere tam uymasan da gerçek katkın varsa başvurabilirsin.', '', '| Grup | Durum | Detay |', '| --- | :---: | --- |');
  for (const g of programs.claude) lines.push(`| ${g.group} | ${ICON[g.status]} | ${g.detail} |`);
  lines.push('');

  lines.push('## Codex for Open Source', '');
  if (programs.codexSignals.length) {
    for (const s of programs.codexSignals) lines.push(`- ${s.ok ? '✅' : '❌'} ${s.signal}`);
  } else {
    lines.push('- ❔ Codex başvurusu için bakımını yaptığın bir repo gerekir. `--repo owner/name` ile ekle.');
  }
  lines.push('');

  lines.push(
    '## Başvuru öncesi kontrol listesi',
    '',
    '- [ ] GitHub profilim herkese açık, fotoğraf ve bio var',
    '- [ ] Göstereceğim repo public, README ve LICENSE var',
    `- [${contrib.externalMerged > 0 ? 'x' : ' '}] Merged PR listemi çıkardım (bu rapor)`,
    '- [ ] İndirme / star / bağımlı repo sayılarını not ettim',
    `- [${contrib.activeWeeks >= 8 ? 'x' : ' '}] Katkı grafiğim son 3 ayda düzenli (en az 8/12 aktif hafta)`,
    '- [ ] Codex formunda ChatGPT hesabımın e-postasını kullandım',
    '- [ ] OpenAI Organization ID’mi buldum (org-…)',
    '- [ ] Form metinlerini kendi sayılarımla gözden geçirdim',
    ''
  );

  const repoName = fill(r.fullName, 'REPO');
  lines.push(
    '## Form metinleri (doldurulmuş taslak)',
    '',
    'Köşeli parantezli `[...]` alanları kendin tamamla. Her alanı 3–5 cümlede tut; sayı ve link ver.',
    '',
    '### Claude — Eligibility (Active contributor)',
    '',
    '```text',
    'Category: Active contributor.',
    `In the last 12 months I have had ${contrib.externalMerged} pull requests merged into repositories I do not own, mainly ${projectList}. Full list:`,
    pullsUrl,
    `My contributions focus on ${fill(extra.focus, 'area: bug fixes and test coverage / docs / CI')}.`,
    '```',
    ''
  );

  if (repo) {
    lines.push(
      '### Claude — Eligibility (Maintainer)',
      '',
      '```text',
      'Category: Maintainer / library author.',
      `I maintain ${repoName}, ${fill(r.description, 'one-line description')}. It has ${fill(r.monthlyDownloads, 'N')} monthly downloads on ${fill(r.registry, 'registry')} and ${fill(r.dependentRepos, 'N')} dependent repositories. I handle reviews, issue triage and releases; ${fill(r.externalContributors, 'N')} external contributors had PRs merged in the last year.`,
      '```',
      ''
    );
  }

  lines.push(
    '### Claude — Intended use',
    '',
    '```text',
    `Primarily with Claude Code on open source work: understanding unfamiliar codebases before contributing, writing and reviewing pull requests, generating regression tests for bugs I fix, and keeping documentation accurate. For ${repoName} specifically I plan to use it for ${fill(extra.task, 'concrete task, e.g. reviewing incoming PRs faster and closing the issue backlog')}.${extra.handle ? ` I share what I learn publicly (${extra.handle}).` : ''}`,
    '```',
    '',
    '### Codex — Why does this repository qualify?',
    '',
    '```text',
    `${repoName} is ${fill(r.description, 'one-line description')}. It has ${fill(r.stars, 'N')} GitHub stars, ${fill(r.monthlyDownloads, 'N')} monthly downloads on ${fill(r.registry, 'npm/PyPI')} and is used by ${fill(r.dependentRepos, 'N')} dependent repositories. I am the ${fill(r.role, 'primary/core')} maintainer: I review every PR, triage issues and cut releases (${fill(r.releasesLastYear, 'N')} releases in the last 12 months).`,
    '```',
    '',
    '### Codex — How will you use API credits?',
    '',
    '```text',
    `Mainly for maintainer work on ${repoName}: automated first-pass review of incoming PRs, reproducing and labeling bug reports, generating regression tests for fixed issues, and keeping docs and changelogs in sync with releases. Codex would also help with ${fill(extra.task, 'a concrete backlog item')}, which I have not had time to do alone.`,
    '```',
    '',
    '### Anything else we should know?',
    '',
    '```text',
    `Besides ${repoName}, I contribute regularly to ${projectList} (${contrib.externalMerged} merged PRs in the last year). I maintain open source in my free time and the plan would directly go into faster reviews and releases for users of the project.`,
    '```',
    '',
    '---',
    '',
    'Kaynaklar: claude.com/contact-sales/claude-for-oss · openai.com/form/codex-for-oss — şartlar değişebilir, başvurmadan önce sayfaları kontrol et.',
    ''
  );

  return lines.join('\n');
}
