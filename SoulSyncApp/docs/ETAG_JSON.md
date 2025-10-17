# JSON ETag middleware
- Dodaje `ETag` na **GET JSON** odgovore i poštuje `If-None-Match` → vraća `304` ako se hash poklapa.
- Smanjuje bandwidth i daje hibridni cache sloj za klijente.
