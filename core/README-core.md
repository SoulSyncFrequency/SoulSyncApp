# SoulSync Core (Calm/Safety Baseline)

Ovaj `/core` sloj implementira **Živčani Sustav** aplikacije s temeljnim tonom
**Smirenje / Sigurnost** i odnosnim poljem **“Netko je sa mnom.”**

## Sastav
- `state.ts` — baseline stanje (presence-first), trend, clamp i update helperi
- `eri.ts` — ERI (Emotional Resonance Interface), **wave-based** intenzitet + ton
- `response.ts` — dinamički miks (Topla prisutnost + Mirna jasnoća) s **jednom** mikro-cue po interakciji
- `loop.ts` — self-regulation petlja: `input → ERI → State → Response`

## Zašto wave-based intensity?
Intenzitet emocije (preplavljenost vs. otvorenost) tretiramo kao **val** koji može ići iznad 1.0.
UI/animacije dobiju `clamped` vrijednost (0..1), ali *logika* vidi realnu amplitudu, što omogućuje:
- tiho prisustvo kad je stvarno previše (bez “vježbi”)
- meko vođenje kada je prostora dovoljno
- potvrdu i prostor kad je otvoreno

## Integracija (Node/Express primjer)
```ts
// api/session.ts
import { defaultState } from "./core/state";
import { processInput } from "./core/loop";

let sessionState = defaultState();

export function handleUserText(text: string) {
  const { eri, response, nextState } = processInput({ text }, sessionState);
  sessionState = nextState;
  return { eri, response };
}
```

## Integracija (React primjer)
```ts
// App.tsx
import { useRef, useState } from "react";
import { defaultState } from "./core/state";
import { processInput } from "./core/loop";

export default function App() {
  const stateRef = useRef(defaultState());
  const [out, setOut] = useState<string>("");

  function onSubmit(text: string) {
    const { response, nextState } = processInput({ text }, stateRef.current);
    stateRef.current = nextState;
    setOut(response.text);
  }

  // render ...
}
```

## Somatska pravila (sažetak)
- **Visok intenzitet** → *Tiho prisustvo* (“Tu sam. Ne moraš ništa.”)
- **Srednji intenzitet** → *Jedna mikro-cue* (tijelo **ili** dah)
- **Niski intenzitet** → *Prostor & potvrda*

## Napomene
- `eri.ts` koristi heuristički leksikon (HR) + prozodiju (interpunkcija, duljina) + somatske markere.
- Po potrebi kasnije možemo dodati embeddings / NER, ali ovaj sloj je spreman za rad *odmah*.
