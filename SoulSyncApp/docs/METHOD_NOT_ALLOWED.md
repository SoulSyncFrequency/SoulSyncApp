# 405 Method Not Allowed
- A best-effort handler returns `405` for requests that match known OpenAPI paths but with the wrong HTTP method.
- Prevents silent 404s on misused endpoints.
