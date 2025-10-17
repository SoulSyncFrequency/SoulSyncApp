// Call this in your PDF generator after therapy is assembled:
export function annotatePrimaryMoleculeSection(therapy: { primaryMolecule?: string; meta?: any }, pdf: any) {
  if (!therapy?.primaryMolecule) return;
  const provenance = therapy?.meta?.primaryMolecule?.provenance;
  const label =
    provenance === "ai"
      ? `Primarna molekula (AI predložena, F₀ validirana): ${therapy.primaryMolecule} \u2B50`
      : `Primarna molekula: ${therapy.primaryMolecule} \u2B50`;
  if (typeof pdf?.addSection === "function") {
    pdf.addSection("Primarna molekula", { text: label });
  } else if (typeof pdf?.text === "function") {
    pdf.text(label);
  }
}
