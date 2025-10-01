# /ops/rca-hints
- Heuristički "root-cause" savjeti iz `logs/access.ndjson` (zadnjih ~20k linija u zadanom prozoru, default 15m preko `?window=`).
- Prepoznaje povišen 5xx, 504 timeouts te izolirani p95 spike na jednoj ruti (N+1/upit/serijalizacija).
- Informativno, bez vanjskih poziva.
