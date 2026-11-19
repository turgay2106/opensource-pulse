import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchMergedPRs } from '../src/github.js';

test('fetchMergedPRs builds the search query and maps results', async () => {
  let calledUrl;
  const fetchImpl = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      json: async () => ({
        total_count: 1,
        items: [{ repository_url: 'https://api.github.com/repos/nodejs/node', number: 7, title: 'fix', html_url: 'https://github.com/nodejs/node/pull/7', pull_request: { merged_at: '2026-10-01T00:00:00Z' } }]
      })
    };
  };
  const prs = await fetchMergedPRs('alice', new Date('2025-11-19T00:00:00Z'), { fetchImpl });
  const q = decodeURIComponent(new URL(calledUrl).searchParams.get('q'));
  assert.equal(q, 'is:pr is:merged author:alice -user:alice merged:>=2025-11-19');
  assert.deepEqual(prs, [{ repo: 'nodejs/node', number: 7, title: 'fix', url: 'https://github.com/nodejs/node/pull/7', mergedAt: '2026-10-01T00:00:00Z' }]);
});

test('fetchMergedPRs surfaces API errors', async () => {
  const fetchImpl = async () => ({ ok: false, status: 403, text: async () => 'rate limited' });
  await assert.rejects(fetchMergedPRs('alice', new Date(), { fetchImpl }), /403/);
});
