# Branch Protection – Recommended Settings (GitHub)

Apply to `main`:
- ✅ Require pull request reviews (at least 1–2 reviewers).
- ✅ Require status checks to pass before merging:
  - `Final Launch Matrix`
  - `Quality Gate`
  - `CodeQL`
  - `Gitleaks`
  - `SBOM`
  - `OpenAPI Schema Tests`
  - `Helm Chart Testing`
- ✅ Require branches to be up to date before merging.
- ✅ Require signed commits (optional but recommended).
- ✅ Restrict who can push to matching branches (maintainers only).
- 🔐 Secrets: set `SLACK_CI_WEBHOOK`, `RENDER_SERVICE_ID`, `RENDER_API_KEY`, `SENTRY_DSN` in GitHub Secrets.
