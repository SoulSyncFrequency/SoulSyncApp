# Safety Lint Enhanced
- `lintPlanEnhanced({ doses, weightKg? })` dodaje guardrail po kg (npr. Pregnenolone 1.5 mg/kg/day, ilustrativno) i sanity check za `timesPerDay>12`.
- Endpoint `/ops/safety-lint` automatski koristi enhanced varijantu ako primite `weightKg` u request tijelu.
- Uvijek sadrži disclaimer: Informational only. Not medical advice.
