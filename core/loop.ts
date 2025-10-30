// core/loop.ts
// Self‑regulation loop: input -> ERI -> State -> Response
import { CoreState, withUpdate } from "./state";
import { ERIInput, evaluateERI } from "./eri";
import { generateResponse, ResponseOut } from "./response";

export interface LoopResult {
  eri: ReturnType<typeof evaluateERI>;
  response: ResponseOut;
  nextState: CoreState;
}

export function processInput(input: ERIInput, state: CoreState): LoopResult {
  const eri = evaluateERI(input);
  const nextState = withUpdate(state, eri.intensity);
  const response = generateResponse(nextState, eri);
  return { eri, response, nextState };
}
