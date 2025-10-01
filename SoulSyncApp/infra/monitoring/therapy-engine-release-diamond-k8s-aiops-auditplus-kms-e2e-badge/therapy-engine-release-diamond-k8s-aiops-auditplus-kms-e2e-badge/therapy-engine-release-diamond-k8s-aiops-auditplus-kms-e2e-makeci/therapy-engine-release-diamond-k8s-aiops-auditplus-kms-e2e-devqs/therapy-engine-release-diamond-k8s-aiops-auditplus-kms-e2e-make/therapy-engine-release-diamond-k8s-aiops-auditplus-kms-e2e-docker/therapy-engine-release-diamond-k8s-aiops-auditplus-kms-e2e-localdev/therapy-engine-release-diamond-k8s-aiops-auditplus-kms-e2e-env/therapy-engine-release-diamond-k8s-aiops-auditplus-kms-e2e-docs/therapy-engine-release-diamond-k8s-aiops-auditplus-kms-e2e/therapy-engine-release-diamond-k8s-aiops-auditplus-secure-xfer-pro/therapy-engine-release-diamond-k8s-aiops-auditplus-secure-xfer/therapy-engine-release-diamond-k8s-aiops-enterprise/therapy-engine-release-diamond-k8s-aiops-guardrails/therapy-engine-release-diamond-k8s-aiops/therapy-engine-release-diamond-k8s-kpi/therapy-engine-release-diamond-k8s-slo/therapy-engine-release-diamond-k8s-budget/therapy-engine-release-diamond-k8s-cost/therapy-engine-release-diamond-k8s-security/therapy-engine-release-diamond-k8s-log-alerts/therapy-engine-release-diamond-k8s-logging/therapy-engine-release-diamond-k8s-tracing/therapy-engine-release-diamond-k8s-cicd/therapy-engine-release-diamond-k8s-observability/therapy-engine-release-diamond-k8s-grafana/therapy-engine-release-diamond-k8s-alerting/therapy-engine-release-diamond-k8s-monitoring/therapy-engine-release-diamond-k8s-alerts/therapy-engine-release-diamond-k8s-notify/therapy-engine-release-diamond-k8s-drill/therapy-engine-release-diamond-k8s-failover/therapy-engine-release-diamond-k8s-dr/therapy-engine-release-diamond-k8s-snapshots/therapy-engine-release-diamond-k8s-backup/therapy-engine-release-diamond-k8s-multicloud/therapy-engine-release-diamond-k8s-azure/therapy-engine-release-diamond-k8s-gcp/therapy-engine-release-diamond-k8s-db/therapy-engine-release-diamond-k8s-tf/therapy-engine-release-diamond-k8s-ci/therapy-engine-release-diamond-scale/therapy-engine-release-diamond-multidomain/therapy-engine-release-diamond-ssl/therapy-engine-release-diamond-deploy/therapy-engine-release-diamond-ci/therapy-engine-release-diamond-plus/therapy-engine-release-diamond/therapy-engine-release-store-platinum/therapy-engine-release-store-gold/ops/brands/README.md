# White-label / Multitenant
- U `backend/.env` postavi `MULTITENANT_BRANDS` na sadržaj `ops/brands/brands.example.json` (ili hostaj JSON i koristi ENV varu).
- Prema `Host` headeru, `/brand` vraća naziv i boje.
- Frontend već povlači `/brand` i koristi `brandName` i `brandPrimary`. Dodaj logotipe po hostu u `store/assets/` ako želiš.
