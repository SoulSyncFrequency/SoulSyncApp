# Required Checks for Branch Protection (main)

These are the **status checks** that must pass before merging into `main`.

## ✅ Required

1. **Lint**
   - Job name: `lint`
   - Ensures code style and static analysis are clean.

2. **Typecheck**
   - Job name: `typecheck`
   - Ensures TypeScript compiles without errors.

3. **Test**
   - Job name: `test`
   - Runs the full test suite.

4. **Coverage (Codecov)**
   - Job name: `coverage` (sometimes appears as `coverage / test`)
   - Uploads coverage report to Codecov; fails if below threshold.
   - Requires secret: `CODECOV_TOKEN` (if Codecov requires it).

5. **CodeQL**
   - Job name: `CodeQL / Analyze (javascript)`
   - GitHub’s security scan for vulnerabilities.

6. **Semantic Release**
   - Job name: `semantic-release`
   - Generates CHANGELOG, bumps versions, creates GitHub Release.

## ⚠️ Not Required (optional)
- **Sentry sourcemaps upload**
- **SDK publish**
- **Render deploy hooks**

These depend on external services (Sentry, GitHub Packages, Render) and may fail outside your control. Keep them optional to avoid blocking merges when the code itself is healthy.

---

## How to configure
1. Go to **Settings → Branches → Branch protection rules**.
2. Add rule for `main`.
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - (Optional) ✅ Require signed commits
4. Select the required checks listed above (exact job names).
