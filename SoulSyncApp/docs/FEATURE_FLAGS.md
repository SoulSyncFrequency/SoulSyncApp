# Feature Flags

Use runtime-togglable flags to enable/disable risky features without redeploy.

## Flags
- `FALLBACK_PDF_ENGINE` (boolean) — koristi stariji engine za PDF ako je `true`.
- `EXPERIMENTAL_NEW_FLOW` (boolean) — uključuje eksperimentalni flow.

## Upotreba
```ts
import { loadFlags } from '../flags'

const flags = loadFlags()
if (flags.FALLBACK_PDF_ENGINE) {
  // pozovi stari PDF engine
}
```

> Booleane postavi u Render/ENV: `true/false` ili `1/0`.
