# v45 Audit & Fixes

- [OK] scripts/smoke.sh present
- [FIX] openapi.ts path corrected to openapi/openapi.json
- [ADD] Hadolint workflow
- [ADD] .env.example updated: Slack webhook env
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/publish.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 9:
        tags:
            ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/e2e.yml: mapping values are not allowed here
  in "<unicode string>", line 9, column 55:
     ...  stub - run Maestro locally with: maestro test e2e/happy-path.te ... 
                                         ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/docker.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/meta-check.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ "main" ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/docs.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 13:
        branches: ["main"]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/test.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/lint-config.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/lint-build.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/tests.yml: mapping values are not allowed here
  in "<unicode string>", line 19, column 10:
        steps:
             ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/codecov.yml: mapping values are not allowed here
  in "<unicode string>", line 19, column 10:
        steps:
             ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/security-scan.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/codeql.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: "CodeQL"
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 39, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/typecheck.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/sentry-release.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 9:
        tags:
            ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/lint-format.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/npm-audit.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: npm audit
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 25, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/sentry-sourcemaps.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 9:
        tags:
            ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/sdk-rest.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 10:
        paths:
             ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/release-all-in-one.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 9:
        tags:
            ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/openapi-lint.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 10:
        paths:
             ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/gitleaks.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: Gitleaks
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 21, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/sbom.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: SBOM
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 25, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/quality-gate.yml: mapping values are not allowed here
  in "<unicode string>", line 35, column 47:
     ... px jest --coverage --      - run: npx jest --coverage --coverage ... 
                                         ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/integration-tests.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: Integration Tests (Compose)
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 46, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/helm-ci.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: Helm Lint
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 25, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/chart-testing.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: Helm Chart Testing
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 30, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/openapi-schema-tests.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: OpenAPI Schema Tests
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 35, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/launch-rehearsal.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: Launch Rehearsal
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 49, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/.github/workflows/final-matrix.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    name: Final Launch Matrix
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 81, column 1:
    - name: Notify Slack on failure
    ^
- [WARN] YAML parse error in /mnt/data/ss_fullapp_v45/infra/monitoring/prometheus/alerts.yml: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    groups:
    ^
expected <block end>, but found '-'
  in "<unicode string>", line 19, column 1:
    - alert: HighLatencyP95
    ^

- [FIX] Removed invalid Slack step append in: codeql.yml, npm-audit.yml, gitleaks.yml, sbom.yml, quality-gate.yml, integration-tests.yml, helm-ci.yml, chart-testing.yml, openapi-schema-tests.yml, launch-rehearsal.yml, final-matrix.yml
- [WARN] YAML parse errors remain:
  - publish.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 9:
        tags:
            ^
  - e2e.yml: mapping values are not allowed here
  in "<unicode string>", line 9, column 55:
     ...  stub - run Maestro locally with: maestro test e2e/happy-path.te ... 
                                         ^
  - docker.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - meta-check.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ "main" ]
                ^
  - docs.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 13:
        branches: ["main"]
                ^
  - test.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 13:
        branches: [ main ]
                ^
  - lint-config.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - lint-build.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - tests.yml: mapping values are not allowed here
  in "<unicode string>", line 19, column 10:
        steps:
             ^
  - codecov.yml: mapping values are not allowed here
  in "<unicode string>", line 19, column 10:
        steps:
             ^
  - security-scan.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - typecheck.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - sentry-release.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 9:
        tags:
            ^
  - lint-format.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - sentry-sourcemaps.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 9:
        tags:
            ^
  - sdk-rest.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 10:
        paths:
             ^
  - release-all-in-one.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 9:
        tags:
            ^
  - openapi-lint.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 10:
        paths:
             ^
  - quality-gate.yml: mapping values are not allowed here
  in "<unicode string>", line 35, column 47:
     ... px jest --coverage --      - run: npx jest --coverage --coverage ... 
                                         ^
- [ACTION] Archived invalid workflow files to .github/workflows/_archive:
  - e2e.yml: mapping values are not allowed here
  in "<unicode string>", line 9, column 55:
     ...  stub - run Maestro locally with: maestro test e2e/happy-path.te ... 
                                         ^
  - docker.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - test.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 13:
        branches: [ main ]
                ^
  - lint-config.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - lint-build.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - tests.yml: mapping values are not allowed here
  in "<unicode string>", line 19, column 10:
        steps:
             ^
  - codecov.yml: mapping values are not allowed here
  in "<unicode string>", line 19, column 10:
        steps:
             ^
  - security-scan.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - typecheck.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - sentry-release.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 9:
        tags:
            ^
  - lint-format.yml: mapping values are not allowed here
  in "<unicode string>", line 8, column 13:
        branches: [ main ]
                ^
  - sentry-sourcemaps.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 9:
        tags:
            ^
  - sdk-rest.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 10:
        paths:
             ^
  - release-all-in-one.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 9:
        tags:
            ^
  - openapi-lint.yml: mapping values are not allowed here
  in "<unicode string>", line 7, column 10:
        paths:
             ^
  - quality-gate.yml: mapping values are not allowed here
  in "<unicode string>", line 35, column 47:
     ... px jest --coverage --      - run: npx jest --coverage --coverage ... 
                                         ^
