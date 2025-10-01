# Adopt CI Quality Gates (lint, tests, coverage, security scans)

*Status: accepted*  
*Date: 2025-09-19*

## Context
To ensure production stability and compliance, we need automated quality checks.

## Decision
Adopt GitHub Actions workflows for lint, build, tests (Vitest), coverage (Codecov gate 80%), secrets scanning (Gitleaks), SBOM + vulnerabilities (Trivy), Docker image builds (GHCR) and predeploy self-check.

## Consequences
- ✅ Prevents broken builds and insecure configs from reaching main
- ✅ Documents and standardizes release gates
- ⚠️ Slightly longer CI times, acceptable trade-off
