# OpenAPI cache headers
- Za `GET /openapi.json` dodani su `Cache-Control: public, max-age=300, must-revalidate`, `ETag` i `Last-Modified`.
- Pomaže klijentima/SDK generatorima u pametnom keširanju.
