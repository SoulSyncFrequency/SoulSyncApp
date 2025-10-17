export function annotatePrimaryMoleculeSection(therapy: { primaryMolecule?: string; meta?: any }, pdf: any) {
  if (!therapy?.primaryMolecule) return;
  const provenance = therapy?.meta?.primaryMolecule?.provenance;
  const desc = therapy?.meta?.primaryMolecule?.description;
  const label =
    provenance === "ai"
      ? `Primarna molekula (AI predložena, F₀ validirana): ${therapy.primaryMolecule}${desc ? ' — ' + desc : ''} \u2B50`
      : `Primarna molekula: ${therapy.primaryMolecule}${desc ? ' — ' + desc : ''} \u2B50`;
  if (typeof pdf?.addSection === "function") {
    pdf.addSection("Primarna molekula", { text: label });
  } else if (typeof pdf?.text === "function") {
    pdf.text(label);
  }
}
