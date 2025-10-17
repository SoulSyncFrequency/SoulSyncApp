# Admin Ops Dashboard CSP (nonce)
- `GET /admin/ops-dashboard` injektira **nonce** u `<style>` i `<script>` i postavlja **Content-Security-Policy** header sa `'self'` + `'nonce-<value>'` direktivama.
- `public/admin_ops.html` sadrži placeholder `__CSP_NONCE__` koji se zamjenjuje u letu.
