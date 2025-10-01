import { ensurePrimaryMolecule } from "../ensurePrimaryMolecule";

describe("ensurePrimaryMolecule (async)", () => {
  test("Falls back to registry or AI when missing (async)", async () => {
    const disease = { name: "Multiple Sclerosis" } as any;
    const therapy = { molecules: [] } as any;
    const result = await ensurePrimaryMolecule(therapy, disease, { runF0Validation: false });
    expect(result.molecules.length).toBeGreaterThan(0);
    expect(result.primaryMolecule).toBeDefined();
  });
});

test("AI similarity fallback suggests from registry when close match", async () => {
  const disease = { name: "Type 2 Diabetes" } as any; // registry key: "diabetes type 2"
  const therapy = { molecules: [] } as any;
  const result = await ensurePrimaryMolecule(therapy, disease, { runF0Validation: false });
  expect(result.primaryMolecule).toBeDefined();
});
