import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 7070;

// Toy PAINS/tox keyword lists (placeholder, not scientific)
const PAINS_KEYWORDS = ["catechol", "rhodanine", "isothiazolone", "quinone", "phenolic"];
const TOX_KEYWORDS = ["nitro", "anilide", "azide", "arsenic", "cyanide", "mustard"];

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/painsRules", (_req, res) => {
  res.json({ pains: PAINS_KEYWORDS, tox: TOX_KEYWORDS, note: "Stubbed rules; use real cheminformatics externally." });
});

app.post("/validate", (req, res) => {
  const { smiles = "" } = req.body || {};
  const s = String(smiles).toLowerCase();
  const painsHits = PAINS_KEYWORDS.filter(k => s.includes(k)).length;
  const toxHits = TOX_KEYWORDS.filter(k => s.includes(k)).length;
  res.json({
    smiles,
    painsFlags: painsHits,
    toxSignals: toxHits,
    notes: ["Stubbed validation. Flags are naive substring hits; not scientific."],
  });
});
app.post("/canonicalize", (req, res) => {
  const { smiles } = req.body || {};
  // Extremely naive "canonicalization"
  const canonical = (String(smiles||"").split("").sort().join(""));
  res.json({ input: smiles, canonical });
});

app.listen(PORT, () => console.log(`Chem microservice on :${PORT}`));
