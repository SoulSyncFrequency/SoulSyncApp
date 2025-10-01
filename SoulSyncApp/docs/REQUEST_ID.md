# Request ID
- Middleware generira/propagira **X-Request-Id** (koristi incoming header ako postoji, inače `crypto.randomUUID()`).
- ID se postavlja na `res.locals.requestId` i `X-Request-Id` header odgovora.
- Preporuka: logovi i error handler trebaju uključivati requestId (ako već ne uključuju).
