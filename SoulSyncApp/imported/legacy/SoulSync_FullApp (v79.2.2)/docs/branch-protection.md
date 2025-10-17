# Branch Protection Guidelines

To protect the `main` branch in GitHub:

1. Go to **Settings → Branches → Branch protection rules**.
2. Add a rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1+)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
3. Under **Status checks that are required**, enable:
   - `E2E Tests`
   - `k8s-guard`
   - `meta-check`
   - `lint/build`
4. Optional:
   - Enable **Dismiss stale pull request approvals when new commits are pushed**.
   - Enable **Block force pushes** and **Block branch deletions**.

This ensures all code merged to `main` passed tests and security checks.
