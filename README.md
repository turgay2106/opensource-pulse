# OpenSource Pulse

OpenSource Pulse is a small, dependency-free GitHub Action and CLI for open-source maintainers and contributors. It turns structured repository signals into a practical Markdown maintenance report.

The first release focuses on four transparent checks: unlabeled issues, stale issues, open pull requests, and failing checks. It is intentionally rule-based so maintainers can inspect every finding and adapt the input format to their workflow.

## GitHub Action

```yaml
name: Maintenance report
on:
  workflow_dispatch:
  schedule:
    - cron: '0 9 * * 1'

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: turgay2106/opensource-pulse@v0.1.0
        with:
          input: pulse-input.json
          output: pulse-report.md
      - uses: actions/upload-artifact@v4
        with:
          name: opensource-pulse-report
          path: pulse-report.md
```

## CLI

```bash
node src/cli.js pulse-input.json pulse-report.md
npm test
```

Input is JSON with `issues`, `pullRequests`, and `checks` arrays. The tool does not call an AI model and does not upload repository content anywhere.

## OSS eligibility tracker / Uygunluk takipçisi

`oss-eligibility` measures your progress toward open-source AI programs such as **Claude for Open Source** and **Codex for Open Source**, and drafts the application texts with your real numbers.

`oss-eligibility`, açık kaynak AI programlarına (**Claude for Open Source**, **Codex for Open Source**) ne kadar yakın olduğunu ölçer ve başvuru form metinlerini kendi sayılarınla doldurur:

- Son 12 ayda **sahibi olmadığın** repolara merge edilen PR sayısı (aktif katkıcı eşiği: 100)
- Repo bazında dağılım ve son 12 haftalık düzen (haftada ~2 PR hedefi)
- Bakımını yaptığın repo için star, dış katkıcı, release sayıları (maintainer / topluluk / Codex kontrolleri)
- Başvuru öncesi kontrol listesi ve doldurulmuş İngilizce form taslakları

```bash
# Canlı veri (GITHUB_TOKEN önerilir)
GITHUB_TOKEN=... node src/eligibility-cli.js --user <kullanıcı-adı> --repo <owner/name> \
  --downloads 18000 --registry npm --dependents 85 --role primary --handle @hesabin

# Çevrimdışı örnek
npm run example   # examples/eligibility-input.json -> oss-eligibility.md

node src/eligibility-cli.js --help
```

GitHub Actions'ta: **Actions → OSS eligibility report → Run workflow** ile kullanıcı adını gir; rapor iş özetinde ve artifact olarak çıkar. Workflow her pazartesi repo sahibi için de otomatik çalışır.

Katkıya nasıl başlanacağı ve programların şartları için: [docs/katki-rehberi.md](docs/katki-rehberi.md).

The tool only reads public GitHub data and never sends it anywhere else. Acceptance into either program is decided by humans; the report is a guide, not a guarantee.

## Status

This is an early release. Feedback, reproducible bug reports, tests, and documentation improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
