#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { analyzeContributions, evaluatePrograms, renderReport, windowStart } from './eligibility.js';
import { fetchMergedPRs, fetchRepoStats } from './github.js';

const HELP = `Kullanım:
  oss-eligibility --user <github-kullanıcı-adı> [seçenekler]
  oss-eligibility --input data.json [seçenekler]

Seçenekler:
  --user, -u        GitHub kullanıcı adı (GitHub API'den canlı veri çeker)
  --repo, -r        Bakımını yaptığın repo (owner/name) — maintainer/Codex kontrolleri için
  --input, -i       Çevrimdışı JSON: { "username", "pullRequests": [...], "repository": {...} }
  --out, -o         Rapor dosyası (varsayılan: oss-eligibility.md)
  --downloads       Aylık indirme sayısı (npm/PyPI vb.)
  --registry        Paket kayıt yeri (ör. npm, PyPI)
  --dependents      GitHub "Used by" bağımlı repo sayısı
  --role            Rolün: primary | core
  --focus           Katkı alanın (ör. "bug fixes and test coverage")
  --task            Projeye dönük somut kullanım (ör. "migrating the test suite to Vitest")
  --handle          Sosyal medya hesabın (ör. @kullanici)
  --json            Markdown yerine JSON çıktı üret
  --help, -h        Bu yardımı göster

GITHUB_TOKEN ortam değişkeni varsa kullanılır (rate limit için önerilir).`;

const { values } = parseArgs({
  options: {
    user: { type: 'string', short: 'u' },
    repo: { type: 'string', short: 'r' },
    input: { type: 'string', short: 'i' },
    out: { type: 'string', short: 'o', default: 'oss-eligibility.md' },
    downloads: { type: 'string' },
    registry: { type: 'string' },
    dependents: { type: 'string' },
    role: { type: 'string' },
    focus: { type: 'string' },
    task: { type: 'string' },
    handle: { type: 'string' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  }
});

if (values.help || (!values.user && !values.input)) {
  console.log(HELP);
  process.exit(values.help ? 0 : 1);
}

const num = (v) => (v == null ? undefined : Number(v));
const now = new Date();
const since = windowStart(now);
let username = values.user;
let pullRequests;
let repository = null;

if (values.input) {
  const data = JSON.parse(await readFile(values.input, 'utf8'));
  username ||= data.username;
  pullRequests = data.pullRequests || [];
  repository = data.repository || null;
} else {
  const options = { token: process.env.GITHUB_TOKEN };
  console.error(`@${username} için merge edilmiş PR'lar alınıyor...`);
  pullRequests = await fetchMergedPRs(username, since, options);
  if (values.repo) {
    console.error(`${values.repo} istatistikleri alınıyor...`);
    repository = await fetchRepoStats(values.repo, since, options);
  }
}

const overrides = Object.fromEntries(
  Object.entries({
    monthlyDownloads: num(values.downloads),
    registry: values.registry,
    dependentRepos: num(values.dependents),
    role: values.role
  }).filter(([, v]) => v !== undefined)
);
if (Object.keys(overrides).length) repository = { ...(repository || {}), ...overrides };

const contrib = analyzeContributions(pullRequests, { username, now });
const programs = evaluatePrograms(contrib, repository);

const output = values.json
  ? JSON.stringify({ contrib, programs, repository }, null, 2) + '\n'
  : renderReport(contrib, programs, repository, { focus: values.focus, task: values.task, handle: values.handle });

await writeFile(values.out, output);
console.log(`${values.out} yazıldı — ${contrib.externalMerged}/${contrib.target} merged PR, ${contrib.activeWeeks}/12 aktif hafta.`);
