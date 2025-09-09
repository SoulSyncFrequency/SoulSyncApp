# Auto-Optimization Pack (Autodetect + Automerge)

Drop-in u root repozitorija. Sadrži:
- `.github/workflows/quality.yml` (AUTODETECT) → lint, typecheck, test + coverage, build, Lighthouse, Codecov
- `.github/dependabot.yml` → weekly dependency PRs (backend + frontend)
- `.github/workflows/dependabot-automerge.yml` → auto-merge Dependabot PR-ova kad Quality Gate prođe
- `.github/workflows/codeql.yml` → CodeQL security scan
- `.eslintrc.cjs`, `.prettierrc.json`, `.lintstagedrc.json`, `.editorconfig`, `.nvmrc`
- `.husky/pre-commit` → lint-staged prije svakog commita (lokalno: `npx husky install`)
- `lighthouserc.json` → Lighthouse budžeti (soft-fail)

Nakon commita:
1) U repo **Settings → Secrets → Actions** postavi `CODECOV_TOKEN` (za Codecov).
2) (Opcionalno lokalno) pokreni `npx husky install` jednom na računalu.
3) Na **Actions** tabu vidiš:
   - **Quality Gate** (svaki push/PR)
   - **CodeQL** (push/PR + tjedno)
   - **Dependabot Auto-Merge** (samo Dependabot PR-ovi, nakon prolaska checkova)
