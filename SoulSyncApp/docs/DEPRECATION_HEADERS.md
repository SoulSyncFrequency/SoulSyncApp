# Deprecation & Sunset headers
- Configure `DEPRECATE_ROUTES` as JSON map of path -> {sunset, link, alt, migration}
- Middleware sets `Deprecation: true`, `Sunset`, and `Link` relations per RFC 8594.
