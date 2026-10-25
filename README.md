# OpenSource Pulse

OpenSource Pulse is a small, dependency-free GitHub Action and CLI for open-source maintainers. It turns structured repository signals into a practical Markdown maintenance report.

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

## Status

This is an early release. Feedback, reproducible bug reports, tests, and documentation improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
