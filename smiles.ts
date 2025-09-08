const LIB = {
  base: ['C1=CC=CC=C1','CCO','CC(=O)O','CCN','C=O','CCCN','CCOC'],
  mood: ['CN1CCC(CC1)C2=CC=CC=C2','CC(=O)NC1=CC=CC=C1O','CCN(CC)CC'],
  focus: ['CN1C=NC2=C1C(=O)N(C(=O)N2)C','CN(C)C=O','CC(C)N'],
  sleep: ['CC(=O)NCCC1=CNc2c1cccc2','CC1=CC(=O)NC(=O)N1','O=C(N)C=O']
}
export function generateValidSmiles(disease: string): string {
  const d = disease.toLowerCase()
  if (/(depress|bpd|mood)/.test(d)) return LIB.mood[0]
  if (/(adhd|focus|attention)/.test(d)) return LIB.focus[0]
  if (/(insom|sleep)/.test(d)) return LIB.sleep[0]
  if (/(anx|panic)/.test(d)) return LIB.mood[2]
  return LIB.base[0]
}
