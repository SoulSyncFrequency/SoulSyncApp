import { ensurePrimaryMolecule, ensurePrimaryMoleculeSync } from "../ensurePrimaryMolecule";

describe("ensurePrimaryMolecule", () => {
  test("Adds disease-level primary molecule if missing (sync)", () => {
    const disease = { name: "Asbestosis", primaryMolecule: "C60" };
    const therapy = { molecules: ["Other"] } as any;
    const result = ensurePrimaryMoleculeSync(therapy, disease, { runF0Validation: false });
    expect(result.molecules[0]).toBe("C60");
    expect(result.primaryMolecule).toBe("C60");
  });

  test("Uses registry when disease mapping missing (sync)", () => {
    const disease = { name: "Osteoporosis" };
    const therapy = { molecules: [] } as any;
    const result = ensurePrimaryMoleculeSync(therapy, disease, { runF0Validation: false });
    expect(result.molecules[0]).toBe("CaCO3");
    expect(result.primaryMolecule).toBe("CaCO3");
  });

  test("No duplicates when already present", () => {
    const disease = { name: "Asbestosis", primaryMolecule: "C60" };
    const therapy = { molecules: ["C60", "Other"] } as any;
    const result = ensurePrimaryMoleculeSync(therapy, disease, { runF0Validation: false });
    const count = result.molecules.filter((m: string) => m === "C60").length;
    expect(count).toBe(1);
  });
});
