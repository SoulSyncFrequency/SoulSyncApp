# Patents & Modules Registry (SoulSync)

> Jedno mjesto za mapiranje **patentnih ideja** i **terapijskih modula** u kodu.

## Patenti / Ideje (sažetak)
- F₀ validator / frekvencijske intervencije
- SMILES molekularni generator (emocionalno-kemijske mape)
- EMDR / neurostimulacija vođena protokolima
- Psilocybin / set & setting protokoli
- Nutrition & Lifestyle / mikro navike

## Mapiranje na Module
| Modul | Endpoint | Config ključevi | Napomene |
|------|----------|------------------|----------|
| F0 Validator | /engine/f0-validator | { f0Target, tolerance, window } | Validacija/analiza |
| SMILES Generator | /engine/smiles-generator | { profile, constraints } | Generiranje |
| EMDR | /engine/emdr | { protocolId, duration } | Sesije |
| Psilocybin | /engine/psilo | { doseModel, profile } | Protokoli |
| Nutrition | /engine/nutrition | { planType, restrictions } | Planovi |

> Ovaj dokument je **izvor istine** — dopuni prema stvarnim endpointima nakon integracije.
