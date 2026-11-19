// Minimal GitHub REST client (no dependencies). Uses GITHUB_TOKEN when available.

const API = 'https://api.github.com';

async function request(path, { token, fetchImpl = globalThis.fetch } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'opensource-pulse' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchImpl(`${API}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} for ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function searchAll(query, options) {
  const items = [];
  // The search API returns at most 1000 results (10 pages x 100).
  for (let page = 1; page <= 10; page++) {
    const data = await request(`/search/issues?q=${encodeURIComponent(query)}&per_page=100&page=${page}`, options);
    items.push(...data.items);
    if (data.items.length < 100 || items.length >= data.total_count) break;
  }
  return items;
}

const repoFromUrl = (url = '') => url.replace(`${API}/repos/`, '');

/** Merged PRs authored by `username` in repositories they do not own, merged on/after `since`. */
export async function fetchMergedPRs(username, since, options = {}) {
  const date = since.toISOString().slice(0, 10);
  const items = await searchAll(`is:pr is:merged author:${username} -user:${username} merged:>=${date}`, options);
  return items.map((item) => ({
    repo: repoFromUrl(item.repository_url),
    number: item.number,
    title: item.title,
    url: item.html_url,
    mergedAt: item.pull_request?.merged_at || item.closed_at
  }));
}

/** Basic stats for a repository you maintain. */
export async function fetchRepoStats(fullName, since, options = {}) {
  const repo = await request(`/repos/${fullName}`, options);
  const owner = repo.owner.login;
  const date = since.toISOString().slice(0, 10);
  const prs = await searchAll(`is:pr is:merged repo:${fullName} -author:${owner} merged:>=${date}`, options);
  const contributors = new Set(prs.map((p) => p.user?.login).filter((l) => l && !l.endsWith('[bot]')));
  let releasesLastYear = 0;
  try {
    const releases = await request(`/repos/${fullName}/releases?per_page=100`, options);
    releasesLastYear = releases.filter((r) => Date.parse(r.published_at) >= since.getTime()).length;
  } catch {
    // releases are optional
  }
  return {
    fullName: repo.full_name,
    description: repo.description || null,
    stars: repo.stargazers_count,
    isPublic: !repo.private,
    externalContributors: contributors.size,
    releasesLastYear
  };
}
