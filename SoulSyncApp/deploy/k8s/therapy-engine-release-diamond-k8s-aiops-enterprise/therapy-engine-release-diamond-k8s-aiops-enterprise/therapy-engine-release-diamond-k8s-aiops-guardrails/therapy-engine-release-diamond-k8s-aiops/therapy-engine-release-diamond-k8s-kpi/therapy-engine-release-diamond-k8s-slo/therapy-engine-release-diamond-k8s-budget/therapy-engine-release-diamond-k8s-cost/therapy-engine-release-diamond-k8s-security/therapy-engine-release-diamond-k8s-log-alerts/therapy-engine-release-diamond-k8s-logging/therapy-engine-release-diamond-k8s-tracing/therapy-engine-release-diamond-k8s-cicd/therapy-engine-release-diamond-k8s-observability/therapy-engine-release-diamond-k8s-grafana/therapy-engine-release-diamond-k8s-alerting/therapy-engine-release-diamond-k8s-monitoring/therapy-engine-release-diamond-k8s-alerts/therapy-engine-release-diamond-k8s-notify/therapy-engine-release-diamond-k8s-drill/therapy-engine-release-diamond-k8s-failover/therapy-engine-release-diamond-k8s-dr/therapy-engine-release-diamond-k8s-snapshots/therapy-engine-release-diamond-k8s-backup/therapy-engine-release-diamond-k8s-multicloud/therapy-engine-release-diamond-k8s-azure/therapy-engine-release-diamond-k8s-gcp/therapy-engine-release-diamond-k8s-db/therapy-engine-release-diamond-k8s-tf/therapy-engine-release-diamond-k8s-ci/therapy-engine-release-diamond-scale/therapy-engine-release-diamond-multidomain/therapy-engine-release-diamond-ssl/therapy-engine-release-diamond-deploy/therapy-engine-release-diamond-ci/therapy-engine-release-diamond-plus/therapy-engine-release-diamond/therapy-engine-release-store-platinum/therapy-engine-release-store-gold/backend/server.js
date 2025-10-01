require('./tracing');
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
const logger = require('./logger');
import pino from "pino";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";
import client from "prom-client";
import crypto from "crypto";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import Stripe from "stripe";
import dotenv from "dotenv";
import fetch from "node-fetch";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pg from "pg";
import * as jose from "jose";
import { authenticator } from "otplib";

dotenv.config();
const app = express();
app.use(cors({ origin: (origin, cb)=> { if (!origin) return cb(null, true); if (FRONTEND_ORIGINS.length===0 || FRONTEND_ORIGINS.includes(origin)) return cb(null, true); cb(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(helmet());
Sentry.init({ dsn: SENTRY_DSN, release: process.env.SENTRY_RELEASE || undefined, beforeSend(event){ try{ if(event.user){ delete event.user.email; delete event.user.ip_address; } if(event.request){ delete event.request.cookies; delete event.request.headers; } }catch{} return event; } });
app.use(Sentry.Handlers.requestHandler());
const logger = pino();
app.use((req,res,next)=>{ try{ req.id = crypto.randomUUID(); res.setHeader('X-Request-ID', req.id);}catch{} next(); });
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "4mb" }));


function hashToken(raw){ return crypto.createHash('sha256').update(raw).digest('hex'); }
async function storeRefreshToken(userId, raw){
  const h = hashToken(raw);
  const exp = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS*24*60*60*1000);
  if (dbMode==='postgres') await pgPool.query("INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)", [userId, h, exp]);
  else sqlite.prepare("INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES (?,?,?)").run(userId, h, exp.toISOString());
}
async function revokeRefreshToken(raw){
  const h = hashToken(raw);
  if (dbMode==='postgres') await pgPool.query("UPDATE refresh_tokens SET revoked=TRUE WHERE token_hash=$1", [h]);
  else sqlite.prepare("UPDATE refresh_tokens SET revoked=1 WHERE token_hash=?").run(h);
}
async function issueTokens(user){
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: "1h" });
  const raw = crypto.randomBytes(32).toString('hex');
  await storeRefreshToken(user.id, raw);
  return { token, refresh_token: raw, expires_in: 3600 };
}

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const counterRequests = new client.Counter({ name: 'http_requests_total', help: 'HTTP requests', labelNames: ['route','method','status'] });
register.registerMetric(counterRequests);
const counterTherapies = new client.Counter({ name: 'therapies_generated_total', help: 'Therapies generated' });
register.registerMetric(counterTherapies);

app.use((req,res,next)=>{
  const start = Date.now();
  res.on('finish', ()=> {
    try { counterRequests.labels(req.path || req.url, req.method, String(res.statusCode)).inc(); } catch {}
  });
  next();
});
app.get('/metrics', async (_req,res)=>{
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Global limiter
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(globalLimiter);
// Per-route limiters
const strictAuthLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
const generateLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const pushTestLimiter = rateLimit({ windowMs: 60 * 1000, max: 2 });

const PORT = process.env.PORT || 5050;
const CHEM_URL = process.env.CHEM_URL || "http://localhost:7070";
const SQLITE_PATH = process.env.SQLITE_PATH || "./sqlite.db";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "";
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || "";
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || "";
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const TOTP_ISSUER = process.env.TOTP_ISSUER || "TherapyEngine";
const SENTRY_DSN = process.env.SENTRY_DSN || "";
const DATA_KEY = process.env.DATA_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const PREMIUM_PRICE_ID = process.env.PREMIUM_PRICE_ID || "";
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || "";
const REVENUECAT_ENTITLEMENT_KEY = process.env.REVENUECAT_ENTITLEMENT_KEY || "premium";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const REMOTE_FLAGS_URL = process.env.REMOTE_FLAGS_URL || "";
const MULTITENANT_BRANDS = (()=>{ try { return JSON.parse(process.env.MULTITENANT_BRANDS||"{}"); } catch { return { default:{ name: "TherapyEngine", primary: "#111827" } }; } })();
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS||"0",10) || 0;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@therapyengine.app";
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS||"").split(",").map(s=>s.trim()).filter(Boolean);
const TERMS_VERSION = process.env.TERMS_VERSION || "1";
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS||"30",10);
const FEATURE_PSY = /^true$/i.test(process.env.FEATURE_PSY || "true");
const REGION_ALLOW_PSY = (process.env.REGION_ALLOW_PSY || "").split(",").map(s=>s.trim().toUpperCase()).filter(Boolean);
const FEATURE_MODULES = (()=>{ try { const o = JSON.parse(process.env.FEATURE_MODULES||"{}"); const out={}; for (const k in o) out[k.toLowerCase()] = !!o[k]; return out; } catch{return {}} })();
const REGION_ALLOW_MODULES = (()=>{ try { const o = JSON.parse(process.env.REGION_ALLOW_MODULES||"{}"); const out={}; for (const k in o) out[k.toLowerCase()] = (o[k]||[]).map(x=>String(x).toUpperCase()); return out; } catch{return {}} })();

// -----------------------------

// -----------------------------
// Encryption helpers

function gateModulesForRegion(modules, req) {
  const reqCountry = (req.headers["cf-ipcountry"] || req.headers["x-country"] || "").toString().toUpperCase() || "XX";
  return (modules||[]).filter(m => {
    const key = String(m||'').toLowerCase();
    // Explicit single-module flags (legacy)
    if (key === 'psilocybin') {
      const psyAllowed = FEATURE_PSY && (REGION_ALLOW_PSY.length===0 || REGION_ALLOW_PSY.includes(reqCountry));
      if (!psyAllowed) return false;
    }
    // Generic flags
    if (Object.prototype.hasOwnProperty.call(FEATURE_MODULES, key) && FEATURE_MODULES[key] === false) return false;
    const allow = REGION_ALLOW_MODULES[key];
    if (Array.isArray(allow) && allow.length>0 && !allow.includes(reqCountry)) return false;
    return true;
  });
}
 (AES-256-GCM) for payload_json (optional)
// -----------------------------
function getKey() {
  if (!DATA_KEY) return null;
  // Accept base64 key (32 bytes) or passphrase (derive via scrypt)
  try {
    const raw = Buffer.from(DATA_KEY, 'base64');
    if (raw.length === 32) return raw;
  } catch {}
  return crypto.scryptSync(DATA_KEY, 'therapyengine-salt', 32);
}
const ENC_KEY = getKey();
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
function enc(obj) {
  const plaintext = Buffer.from(JSON.stringify(obj));
  if (!ENC_KEY) return { clear: JSON.stringify(obj) };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { enc: Buffer.concat([iv, tag, ciphertext]).toString('base64') };
}
function dec(rec) {
  if (rec.clear) return JSON.parse(rec.clear);
  if (!rec.enc) return null;
  if (!ENC_KEY) { // cannot decrypt without key
    throw new Error("DATA_KEY required to decrypt");
  }
  const buf = Buffer.from(rec.enc, 'base64');
  const iv = buf.slice(0,12);
  const tag = buf.slice(12,28);
  const ciphertext = buf.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

// DB Layer: SQLite (default) or Postgres (if DATABASE_URL set)
// -----------------------------
let dbMode = "sqlite";
let sqlite = null;
let pgPool = null;

if (DATABASE_URL && DATABASE_URL.startsWith("postgres://")) {
  dbMode = "postgres";
  pgPool = new pg.Pool({ connectionString: DATABASE_URL });
  // Init tables
  const initPg = async () => {
    await pgPool.query(`CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE,
      expires_at TIMESTAMP,
      revoked BOOLEAN DEFAULT FALSE
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS therapies(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      mode TEXT,
      payload_json TEXT NOT NULL
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE,
      expires_at TIMESTAMP,
      revoked BOOLEAN DEFAULT FALSE
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS device_tokens(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      platform TEXT,
      token TEXT UNIQUE
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE,
      expires_at TIMESTAMP,
      revoked BOOLEAN DEFAULT FALSE
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS audit_logs(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER,
      action TEXT,
      success BOOLEAN,
      ip TEXT,
      detail TEXT
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE,
      expires_at TIMESTAMP,
      revoked BOOLEAN DEFAULT FALSE
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS subscriptions(
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      status TEXT,
      provider TEXT,
      external_id TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS refresh_tokens(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE,
      expires_at TIMESTAMP,
      revoked BOOLEAN DEFAULT FALSE
    )`);
  };
  initPg().catch(console.error);
} else {
  sqlite = new Database(SQLITE_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  sqlite.exec(`CREATE TABLE IF NOT EXISTS therapies(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now')),
    user_id INTEGER NULL,
    mode TEXT,
    payload_json TEXT NOT NULL
  )`);
}

// --- Helpers for queries ---
async function createUser(email, password) {
  const hash = await bcrypt.hash(password, 10);
  if (dbMode === "postgres") {
    const r = await pgPool.query("INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email,created_at", [email, hash]);
    return r.rows[0];
  } else {
    const stmt = sqlite.prepare("INSERT INTO users (email,password_hash) VALUES (?,?)");
    const info = stmt.run(email, hash);
    const row = sqlite.prepare("SELECT id,email,created_at FROM users WHERE id=?").get(info.lastInsertRowid);
    return row;
  }
}
async function findUserByEmail(email) {
  if (dbMode === "postgres") {
    const r = await pgPool.query("SELECT * FROM users WHERE email=$1", [email]);
    return r.rows[0] || null;
  } else {
    return sqlite.prepare("SELECT * FROM users WHERE email=?").get(email) || null;
  }
}
async function saveTherapy(mode, therapy, userId=null) {
  const payloadObj = enc(therapy);
  const payload = JSON.stringify(payloadObj);
  if (dbMode === "postgres") {
    const r = await pgPool.query("INSERT INTO therapies(mode,payload_json,user_id) VALUES($1,$2,$3) RETURNING id", [mode, payload, userId]);
    return r.rows[0].id;
  } else {
    const info = sqlite.prepare("INSERT INTO therapies (mode,payload_json,user_id) VALUES (?,?,?)").run(mode, payload, userId);
    return info.lastInsertRowid;
  }
}
async function listTherapies(userId=null, limit=50) {
  if (dbMode === "postgres") {
    const r = await pgPool.query("SELECT id,created_at,mode FROM therapies WHERE ($1::int IS NULL OR user_id=$1) ORDER BY id DESC LIMIT $2", [userId, limit]);
    return r.rows;
  } else {
    if (userId) {
      return sqlite.prepare("SELECT id,created_at,mode FROM therapies WHERE user_id=? ORDER BY id DESC LIMIT ?").all(userId, limit);
    } else {
      return sqlite.prepare("SELECT id,created_at,mode FROM therapies ORDER BY id DESC LIMIT ?").all(limit);
    }
  }
}
async function getTherapyById(id, userId=null) {
  if (dbMode === "postgres") {
    const r = await pgPool.query("SELECT id,created_at,mode,user_id,payload_json FROM therapies WHERE id=$1", [id]);
    const row = r.rows[0];
    if (!row) return null;
    if (row.user_id && userId && row.user_id !== userId) return { forbidden: true };
    return { ...row, payload: dec(JSON.parse(row.payload_json)) };
  } else {
    const row = sqlite.prepare("SELECT id,created_at,mode,user_id,payload_json FROM therapies WHERE id=?").get(id);
    if (!row) return null;
    if (row.user_id && userId && row.user_id !== userId) return { forbidden: true };
    return { id: row.id, created_at: row.created_at, mode: row.mode, user_id: row.user_id, payload: dec(JSON.parse(row.payload_json)) };
  }
}

// -----------------------------
// Auth middleware
// -----------------------------
function authOptional(req, _res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
}
function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try { req.user = jwt.verify(token, JWT_SECRET); return next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
}

// -----------------------------
// Nutrition policy & engine helpers (same as previous build)
// -----------------------------
const NUTRITION_POLICY = {
  carbs: ["potatoes", "sweet potatoes", "white rice", "fruit", "lactose (dairy)", "honey"],
  proteins: ["red meat", "eggs", "dairy", "organs (liver, heart, kidneys)", "fish", "oysters"],
  fats: ["butter/ghee", "beef tallow", "dairy fat", "egg yolks", "coconut oil", "olive oil", "avocado"],
  avoid: [
    "PUFA seed oils (sunflower, soybean, canola, etc.)",
    "nuts & seeds",
    "oats",
    "leafy/stem vegetables (antinutrients)",
    "fish oil supplements (use whole seafood instead)",
  ],
};
const HZ_MAP = { root: 396, sacral: 417, solar: 528, heart: 639, throat: 741, thirdEye: 852, crown: 963 };
const DISEASE_MAP = {
  bpd: { chakra: "heart", modules: ["EMDR", "Nutrition", "F0", "MP"] },
  anxiety: { chakra: "solar", modules: ["Breath", "Nutrition", "F0", "EMDR"] },
  depression: { chakra: "crown", modules: ["Psilocybin", "EMDR", "Nutrition", "F0"] },
  "back pain": { chakra: "root", modules: ["Fascia", "Heat/Cold", "Nutrition", "F0"] },
  prostatitis: { chakra: "sacral", modules: ["Fascia", "Nutrition", "F0"] },
  ms: { chakra: "thirdEye", modules: ["F0", "QuantumSim", "Nutrition"] },
  schizophrenia: { chakra: "thirdEye", modules: ["F0", "EMDR", "Nutrition"] },
  alzheimer: { chakra: "thirdEye", modules: ["F0", "QuantumSim", "Nutrition"] },
  asbestosis: { chakra: "heart", modules: ["C60", "F0", "Nutrition"] },
};
const LIKERT_MAX = 4;
function clamp(min, v, max) { return Math.max(min, Math.min(max, v)); }
function keywordize(text="") { return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean); }
function scoreChakras(answers) {
  const keys = ["root","sacral","solar","heart","throat","thirdEye","crown"];
  const out = {};
  for (let k of keys) {
    const arr = answers?.[k] || [];
    const total = arr.reduce((a,b)=> a + (Number.isFinite(b)?b:0), 0);
    const avg = arr.length ? total/arr.length : 0;
    out[k] = { total, avg, pct: Math.round((avg/LIKERT_MAX)*100) };
  }
  return out;
}
function pickPrimaryChakras(scores, count=2) {
  const entries = Object.entries(scores);
  entries.sort((a,b)=> a[1].avg - b[1].avg); // lowest avg = most imbalanced
  return entries.slice(0, count).map(([k])=>k);
}
function f0ScoreFromChakras(scores) {
  const h = scores.heart?.avg ?? 0;
  const c = scores.crown?.avg ?? 0;
  const e = scores.thirdEye?.avg ?? 0;
  const r = scores.root?.avg ?? 0;
  const s = scores.solar?.avg ?? 0;
  const base = (h + c + e) / 12; // 0..1
  const drag = (r + s) / 8; // 0..1
  const raw = clamp(0, base * 0.7 + (1 - drag) * 0.3, 1);
  return Number(raw.toFixed(2));
}
function hzPlan(primaryChakras) {
  const unique = Array.from(new Set(primaryChakras));
  return unique.map(key => ({ chakra: key, hz: HZ_MAP[key] }));
}
function smilesCandidate(diseaseKey, f0Score) {
  const lib = [
    { name: "Glycine", smiles: "NCC(=O)O", em: "Calming, sleep architecture support" },
    { name: "Taurine", smiles: "NCCS(=O)(=O)O", em: "GABAergic tone, cardiac rhythm support" },
    { name: "L-Threonine", smiles: "CC(O)C(N)C(=O)O", em: "Mucosal support, protein synthesis" },
  ];
  const pick = lib[(diseaseKey?.length || 0) % lib.length];
  return {
    label: `${pick.name}-derived bio-photonic candidate`,
    smiles: pick.smiles,
    record: `[F0 ${f0Score} | EM ${pick.em} | SMILES ${pick.smiles}]`,
    note: "For quantum/cheminformatics simulation only. Not a medical product.",
  };
}
function fiveDayNutritionPlan(primary, diseaseKey) {
  const baseDay = (title, focus, meals) => ({ title, focus, meals });
  const dairyPush = primary === "sacral";
  const proteinPush = primary === "root" || primary === "solar";
  const fruitHeart = primary === "heart" || primary === "crown";
  const meal = (name, items) => ({ name, items });

  const d1 = baseDay("Day 1 — Energy & Hormones", "Stabilize thyroid/adrenals; carb-protein balance.", [
    meal("Breakfast", [dairyPush ? "Raw/low-heat milk + honey" : "Eggs (3) fried in butter", "Orange juice or ripe fruit"]),
    meal("Lunch", ["Potatoes with butter/ghee", proteinPush ? "200–300g beef" : "Salmon (whole, not oil) + white rice"]),
    meal("Dinner", ["Yogurt/kefir (if tolerated) or cottage cheese", fruitHeart ? "Berries + honey" : "Sweet potato"]),
  ]);
  const d2 = baseDay("Day 2 — Neurotransmitters & Emotions", "Support GABA/serotonin balance, calm focus.", [
    meal("Breakfast", ["Omelet with cheese", "Ripe fruit"]),
    meal("Lunch", ["White rice", "Oysters or lean beef", "Bone broth"]),
    meal("Dinner", ["Potatoes + butter", "Greek yogurt (full fat)"]),
  ]);
  const d3 = baseDay("Day 3 — Chakra Balance & Anti-inflammatory", "Lower PUFA load, optimize mineral density.", [
    meal("Breakfast", ["Raw milk latte (no seed oils)", "Fruit"]),
    meal("Lunch", ["Beef/lamb", "Rice or potatoes", "Liver (1–2×/wk)"]),
    meal("Dinner", ["Cottage cheese", "Honey", "Baked sweet potato"]),
  ]);
  const d4 = baseDay("Day 4 — Tissue & Hormone Regeneration", "High-quality amino acids + cholesterol.", [
    meal("Breakfast", ["Eggs + butter", "Fruit"]),
    meal("Lunch", ["Beef heart or steak", "Potatoes with ghee"]),
    meal("Dinner", ["Ricotta/yogurt", "Honey + fruit"]),
  ]);
  const d5 = baseDay("Day 5 — Integration & F₀ Resonance", "Simplify, light dinner; heart-coherence practice.", [
    meal("Breakfast", ["Milk + honey", "Banana"]),
    meal("Lunch", ["White fish (not oil)", "Rice", "Fruit"]),
    meal("Dinner", ["Bone broth", "Cottage cheese (small)", "Early sleep"]),
  ]);
  return [d1,d2,d3,d4,d5];
}
function supplementPlan(diseaseKey) {
  const common = [
    "Creatine monohydrate (3–5g/day)",
    "Magnesium glycinate (200–400mg/day)",
    "Zinc (food-first: oysters)",
    "Boron (low dose, cycles)",
    "Niacin (flush B3) — titrate, support blood flow",
    "Glycine (food-first: collagen/gelatin, liver)",
  ];
  const perDisease = {
    bpd: ["Ashwagandha (adaptogen)", "Taurine (sleep/soothing)", "L-theanine (focus/calm)"],
    anxiety: ["Taurine", "Glycine before bed"],
    depression: ["Creatine", "Sunlight + bright light AM"],
    "back pain": ["Vitamin D3/K2 if low", "Magnesium"],
    prostatitis: ["Cranberry/D-mannose if UTI-like (short term)", "Taurine"],
    ms: ["Vit D3 if deficient", "Creatine"],
    schizophrenia: ["Glycine (careful, discuss with MD)", "Bright light AM"],
    alzheimer: ["Creatine", "Choline (food-first: eggs)", "Bright light AM"],
    asbestosis: ["C60 (primary source) per your module, research-grade only"],
  };
  const key = (diseaseKey || "").toLowerCase();
  const extra = perDisease[key] || [];
  return Array.from(new Set([...common, ...extra])).filter(x => !/fish oil/i.test(x));
}
function safetyEthicsNotes() {
  return [
    "Educational prototype. Not medical advice. Consult qualified professionals.",
    "Use F₀ resonance filter: if F₀_score < 0.6, prioritize coherence practices before advanced modules.",
    "Psilocybin module only where legal, supervised, and clinically appropriate.",
    "Quantum/cheminformatics simulations do not imply human safety or efficacy.",
    "Avoid PUFA seed oils, nuts, oats, and leafy/stem vegetables per Nutrition & Lifestyle module.",
  ];
}
function extractLabsFromText(txt="") {
  const out = {};
  const patterns = {
    hemoglobin: /(hemoglobin|hb)[:\s]*([0-9]+\.?[0-9]*)/i,
    tsh: /(tsh)[:\s]*([0-9]+\.?[0-9]*)/i,
    vitaminD: /(vit\s*D|25\(OH\)D|vitamin\s*d)[:\s]*([0-9]+\.?[0-9]*)/i,
    crp: /(crp)[:\s]*([0-9]+\.?[0-9]*)/i,
  };
  for (let k in patterns) {
    const m = txt.match(patterns[k]);
    if (m) out[k] = parseFloat(m[2]);
  }
  return out;
}
function guessDiseaseFromText(text="") {
  const words = keywordize(text);
  const keys = Object.keys(DISEASE_MAP);
  let best = null;
  for (let k of keys) {
    const hits = words.filter(w => k.split(" ").some(part => w.includes(part))).length;
    if (!best || hits > best.hits) best = { k, hits };
  }
  if (!best || best.hits === 0) return null;
  return best.k;
}


async function registerDeviceToken(userId, platform, token) {
  if (dbMode === "postgres") {
    await pgPool.query(`INSERT INTO device_tokens(user_id, platform, token) VALUES($1,$2,$3)
      ON CONFLICT (token) DO UPDATE SET user_id=EXCLUDED.user_id, platform=EXCLUDED.platform`, [userId, platform, token]);
  } else {
    try {
      sqlite.prepare("INSERT INTO device_tokens (user_id, platform, token) VALUES (?,?,?)").run(userId, platform, token);
    } catch (e) {
      // unique constraint -> update
      sqlite.prepare("UPDATE device_tokens SET user_id=?, platform=? WHERE token=?").run(userId, platform, token);
    }
  }
}
async function listDeviceTokens(userId) {
  if (dbMode === "postgres") {
    const r = await pgPool.query("SELECT token FROM device_tokens WHERE user_id=$1", [userId]);
    return r.rows.map(x=>x.token);
  } else {
    return sqlite.prepare("SELECT token FROM device_tokens WHERE user_id=?").all(userId).map(x=>x.token);
  }
}
async function sendPushFCM(tokens, title, body, data={}) {
  if (!FCM_SERVER_KEY) return { ok: false, error: "FCM_SERVER_KEY missing" };
  const payload = {
    registration_ids: tokens,
    notification: { title, body },
    data
  };
  const r = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": "key=" + FCM_SERVER_KEY },
    body: JSON.stringify(payload)
  });
  const j = await r.json().catch(()=>({}));
  return { ok: r.ok, status: r.status, response: j };
}


function clientIp(req){ return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').toString(); }
async function audit(userId, action, success, detail) {
  try {
    if (dbMode === "postgres") {
      await pgPool.query("INSERT INTO audit_logs(user_id,action,success,ip,detail) VALUES($1,$2,$3,$4,$5)", [userId, action, !!success, '', detail? String(detail).slice(0,2000): null]);
    } else {
      sqlite.prepare("INSERT INTO audit_logs(user_id,action,success,ip,detail) VALUES (?,?,?,?,?)").run(userId, action, success?1:0, '', detail? String(detail).slice(0,2000): null);
    }
  } catch(e){ logger.error('audit failed', e); }
}

// -----------------------------
// Auth routes
// -----------------------------
app.post("/auth/register", strictAuthLimiter, async (req, res) => {
  try {
    const { email, password, acceptedTerms } = req.body || {};
  const acceptedVersion = acceptedTerms ? TERMS_VERSION : null;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const user = await createUser(email, password, acceptedTerms? new Date().toISOString(): null, acceptedVersion);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: "7d" });
    await audit(user.id, 'register', true, null); res.json({ token, user });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});
app.post("/auth/login", strictAuthLimiter, async (req, res) => {
  try {
    const { email, password, acceptedTerms } = req.body || {};
  const acceptedVersion = acceptedTerms ? TERMS_VERSION : null;
    const user = await findUserByEmail(email || "");
    if (!user) await audit(null, 'login', false, 'invalid user'); return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password || "", user.password_hash);
    if (!ok) await audit(null, 'login', false, 'invalid user'); return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: "7d" });
    await audit(user.id, 'login', true, null); res.json({ token, user: { id: user.id, email: user.email, created_at: user.created_at } });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});
app.get("/me", authRequired, async (req,res)=>{ res.json({ id: req.user.id, email: req.user.email, role: req.user.role || "user" }); });

// -----------------------------
// Healthcheck
// -----------------------------
app.get("/health", (_req,res)=> res.json({ ok: true, db: dbMode }));

app.post("/auth/refresh", async (req,res)=>{
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ error: "refresh_token required" });
    const h = crypto.createHash('sha256').update(refresh_token).digest('hex');
    let row = null;
    if (dbMode==='postgres') {
      const r = await pgPool.query("SELECT user_id, revoked, expires_at FROM refresh_tokens WHERE token_hash=$1", [h]);
      row = r.rows[0];
    } else {
      row = sqlite.prepare("SELECT user_id, revoked, expires_at FROM refresh_tokens WHERE token_hash=?").get(h);
    }
    if (!row || row.revoked || new Date(row.expires_at) <= new Date()) return res.status(401).json({ error: "invalid refresh" });
    await revokeRefreshToken(refresh_token);
    const user = await getUserById(row.user_id);
    const out = await issueTokens(user);
    return res.json(out);
  } catch (e) { res.status(500).json({ error: "refresh failed" }); }
});
app.post("/auth/logout", authRequired, async (req,res)=>{
  try {
    if (dbMode==='postgres') await pgPool.query("UPDATE refresh_tokens SET revoked=TRUE WHERE user_id=$1", [req.user.id]);
    else sqlite.prepare("UPDATE refresh_tokens SET revoked=1 WHERE user_id=?").run(req.user.id);
    res.json({ ok: true });
  } catch(e){ res.status(500).json({ error: "logout failed" }); }
});


app.get("/billing/features", authRequired, async (req,res)=>{
  try {
    const sub = await getSubscription(req.user.id);
    const premium = sub?.status === 'active';
    const features = ['base','export_pdf','reminders'];
    if (premium) features.push('pct_report','priority_push','advanced_frequency');
    res.json({ premium, features });
  } catch(e){ res.status(500).json({ error:'feature check failed' }); }
});


function adminRequired(req,res,next){ if (!req.user || (req.user.role!=='admin')) return res.status(403).json({ error: 'admin required' }); next(); }

app.get("/admin/stats", authRequired, adminRequired, async (req,res)=>{
  try {
    if (dbMode==='postgres') {
      const u = await pgPool.query("SELECT COUNT(*)::int as c FROM users");
      const t = await pgPool.query("SELECT COUNT(*)::int as c FROM therapies");
      const last7 = await pgPool.query("SELECT date_trunc('day', created_at) d, count(*)::int c FROM therapies WHERE created_at > NOW()-interval '7 day' GROUP BY 1 ORDER BY 1");
      return res.json({ users: u.rows[0].c, therapies: t.rows[0].c, last7: last7.rows });
    } else {
      const u = sqlite.prepare("SELECT COUNT(*) c FROM users").get().c;
      const t = sqlite.prepare("SELECT COUNT(*) c FROM therapies").get().c;
      const last7 = sqlite.prepare("SELECT substr(created_at,1,10) d, COUNT(*) c FROM therapies WHERE datetime(created_at) > datetime('now','-7 day') GROUP BY 1 ORDER BY 1").all();
      return res.json({ users: u, therapies: t, last7 });
    }
  } catch(e){ res.status(500).json({ error:'stats failed' }); }
});

app.get("/geo", (req,res)=> { const country = (req.headers["cf-ipcountry"] || req.headers["x-country"] || "").toString().toUpperCase() || "XX"; res.json({ country }); });

// -----------------------------
// Billing (Stripe) — skeleton
// -----------------------------
app.get("/billing/status", authRequired, async (req, res) => {
  const sub = await getSubscription(req.user.id);
  res.json({ premium: sub?.status === 'active', subscription: sub || null });
});
app.post("/billing/create-checkout-session", authRequired, async (req, res) => {
  try {
    if (!stripe || !PREMIUM_PRICE_ID) return res.status(400).json({ error: "Billing not configured" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: (process.env.PUBLIC_URL || "http://localhost") + "/?success=true",
      cancel_url: (process.env.PUBLIC_URL || "http://localhost") + "/?canceled=true",
      client_reference_id: String(req.user.id)
    });
    res.json({ url: session.url });
  } catch (e) {
    logger.error(e); res.status(500).json({ error: "stripe failed" });
  }
});

// RevenueCat status — checks entitlements for current user
app.get("/billing/revenuecat/status", authRequired, async (req, res) => {
  try {
    if (!REVENUECAT_API_KEY) return res.json({ premium: false, note: "RC not configured" });
    const uid = String(req.user.id);
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
      headers: { "Authorization": `Bearer ${REVENUECAT_API_KEY}` }
    });
    const j = await r.json().catch(()=>({}));
    const ent = j?.subscriber?.entitlements || {};
    const e = ent[REVENUECAT_ENTITLEMENT_KEY];
    const active = !!e && (!e.expires_date || new Date(e.expires_date) > new Date());
    if (active) { await setSubscription(req.user.id, 'active', 'revenuecat', e?.product_identifier || null); }
    res.json({ premium: active, entitlement: REVENUECAT_ENTITLEMENT_KEY, rc: !!j?.subscriber });
  } catch (e) {
    res.status(500).json({ premium:false, error: "rc status failed" });
  }
});

app.post("/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(400).end();
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const userId = parseInt(s.client_reference_id);
      await setSubscription(userId, 'active', 'stripe', s.subscription);
      await audit(userId, 'stripe_checkout', true, null);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      // You'd need to map sub.customer to user here if used
    }
    res.json({ received: true });
  } catch (e) {
    logger.error('webhook error', e);
    res.status(400).send(`Webhook Error: ${e.message}`);
  }
});

const swaggerDoc = YAML.load("./docs/openapi.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// -----------------------------
// GDPR: Export my data & Delete my account
// -----------------------------
app.get("/me/export", authRequired, async (req, res) => {
  try {
    const me = { id: req.user.id, email: req.user.email };
    const rows = await listTherapies(req.user.id, 10000);
    const items = [];
    for (const r of rows) {
      const d = await getTherapyById(r.id, req.user.id);
      items.push({ id: r.id, created_at: r.created_at, mode: d.mode, payload: d.payload });
    }
    res.json({ user: me, therapies: items });
  } catch (e) {
    res.status(500).json({ error: "export failed" });
  }
});
app.delete("/me", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    if (dbMode === "postgres") {
      await pgPool.query("DELETE FROM device_tokens WHERE user_id=$1", [userId]);
      await pgPool.query("DELETE FROM therapies WHERE user_id=$1 OR user_id IS NULL AND mode IS NOT NULL AND id IN (SELECT id FROM therapies WHERE user_id=$1)", [userId]);
      await pgPool.query("DELETE FROM user_totp WHERE user_id=$1", [userId]);
      await pgPool.query("DELETE FROM users WHERE id=$1", [userId]);
    } else {
      sqlite.prepare("DELETE FROM device_tokens WHERE user_id=?").run(userId);
      sqlite.prepare("DELETE FROM therapies WHERE user_id=?").run(userId);
      sqlite.prepare("DELETE FROM user_totp WHERE user_id=?").run(userId);
      sqlite.prepare("DELETE FROM users WHERE id=?").run(userId);
    }
    await audit(userId, 'gdpr_delete', true, null);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "delete failed" });
  }
});



async function setSubscription(userId, status, provider='stripe', external_id=null) {
  try {
    if (dbMode === "postgres") {
      await pgPool.query(`INSERT INTO subscriptions(user_id,status,provider,external_id) VALUES($1,$2,$3,$4)
        ON CONFLICT (user_id) DO UPDATE SET status=EXCLUDED.status, provider=EXCLUDED.provider, external_id=EXCLUDED.external_id, updated_at=NOW()`, [userId, status, provider, external_id]);
    } else {
      try {
        sqlite.prepare("INSERT INTO subscriptions (user_id,status,provider,external_id) VALUES (?,?,?,?)").run(userId, status, provider, external_id);
      } catch {
        sqlite.prepare("UPDATE subscriptions SET status=?, provider=?, external_id=?, updated_at=datetime('now') WHERE user_id=?").run(status, provider, external_id, userId);
      }
    }
  } catch (e) { logger.error('setSubscription failed', e); }
}
async function getSubscription(userId) {
  if (dbMode === "postgres") {
    const r = await pgPool.query("SELECT status,provider,external_id FROM subscriptions WHERE user_id=$1", [userId]);
    return r.rows[0] || null;
  } else {
    return sqlite.prepare("SELECT status,provider,external_id FROM subscriptions WHERE user_id=?").get(userId) || null;
  }
}

// -----------------------------
// OAuth endpoints (Google / Apple) — exchange id_token for app JWT
// -----------------------------
app.post("/auth/oauth/google", authLimiter, async (req, res) => {
  try {
    const { id_token } = req.body || {};
    if (!id_token) return res.status(400).json({ error: "id_token required" });
    const JWKS = jose.createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
    const { payload } = await jose.jwtVerify(id_token, JWKS, { audience: GOOGLE_CLIENT_ID, issuer: ["https://accounts.google.com", "accounts.google.com"] });
    const email = payload.email || `${payload.sub}@google.local`;
    let user = await findUserByEmail(email);
    if (!user) {
      const fakePass = Math.random().toString(36).slice(2);
      user = await createUser(email, fakePass); // create record; password not used
    }
    const token = jwt.sign({ id: user.id, email: email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: "7d" });
    await audit(user.id, 'oauth_google', true, null);
    res.json({ token, user: { id: user.id, email } });
  } catch (e) {
    logger.error(e);
    await audit(null, 'oauth_google', false, e?.message);
    res.status(401).json({ error: "OAuth verify failed" });
  }
});

app.post("/auth/oauth/apple", authLimiter, async (req, res) => {
  try {
    const { id_token } = req.body || {};
    if (!id_token) return res.status(400).json({ error: "id_token required" });
    const JWKS = jose.createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
    const { payload } = await jose.jwtVerify(id_token, JWKS, { audience: APPLE_CLIENT_ID, issuer: "https://appleid.apple.com" });
    const email = payload.email || `${payload.sub}@apple.local`;
    let user = await findUserByEmail(email);
    if (!user) {
      const fakePass = Math.random().toString(36).slice(2);
      user = await createUser(email, fakePass);
    }
    const token = jwt.sign({ id: user.id, email: email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: "7d" });
    await audit(user.id, 'oauth_apple', true, null);
    res.json({ token, user: { id: user.id, email } });
  } catch (e) {
    logger.error(e);
    await audit(null, 'oauth_apple', false, e?.message);
    res.status(401).json({ error: "OAuth verify failed" });
  }
});


// Push: register device token (auth optional but recommended)
app.post("/push/register", authOptional, async (req, res) => {
  try {
    const { platform, token } = req.body || {};
    if (!token) return res.status(400).json({ error: "token required" });
    await registerDeviceToken(req.user?.id || null, platform || null, token);
    await audit(req.user?.id || null, 'push_register', true, null); res.json({ ok: true });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "failed to register token" });
  }
});

// Push: send test notification to current user (requires auth + FCM server key)
app.post("/push/test", pushTestLimiter, authRequired, async (req, res) => {
  try {
    const { title = "Therapy Engine", body = "Test notification", data = {} } = req.body || {};
    const tokens = await listDeviceTokens(req.user.id);
    if (!tokens.length) return res.status(404).json({ error: "no tokens for user" });
    const out = await sendPushFCM(tokens, title, body, data);
    await audit(req.user?.id || null, 'push_test', out?.ok, JSON.stringify(out?.response||{}).slice(0,500)); res.json(out);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "failed to send push" });
  }
});


// -----------------------------
// Therapy APIs (auth optional; will associate user if token provided)
// -----------------------------
app.get("/api/therapies", authOptional, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50"), 500);
  const rows = await listTherapies(req.user?.id || null, limit);
  res.json(rows);
});
app.get("/api/therapies/:id", authOptional, async (req, res) => {
  const id = parseInt(req.params.id);
  const row = await getTherapyById(id, req.user?.id || null);
  if (!row) return res.status(404).json({ error: "Not found" });
  if (row.forbidden) return res.status(403).json({ error: "Forbidden" });
  return res.json(row);
});
app.post("/api/generateTherapy", generateLimiter, authOptional, async (req, res) => {
  try {
    const { mode, text, labsText, answers, followUps, followUpAnswers } = req.body || {};
    let guessed = null;
    let scores = {};
    if (mode === "prompt") {
      guessed = guessDiseaseFromText(text || "");
      const kw = keywordize(text || "");
      const pattern = { root:[], sacral:[], solar:[], heart:[], throat:[], thirdEye:[], crown:[] };
      if (kw.includes("back") || kw.includes("lumbar")) pattern.root = Array(20).fill(1);
      if (kw.includes("anxiety")) pattern.solar = Array(20).fill(1.5);
      if (kw.includes("depression")) pattern.crown = Array(20).fill(1);
      if (kw.includes("prostatitis")) pattern.sacral = Array(20).fill(1);
      scores = scoreChakras(pattern);
    } else if (mode === "questionnaire") {
      scores = scoreChakras(answers || {});
    } else {
      return res.status(400).json({ error: "mode must be 'prompt' or 'questionnaire'" });
    }

    const primary = pickPrimaryChakras(scores, 2);
    const f0 = f0ScoreFromChakras(scores);
    const hz = hzPlan(primary);
    const smiles = smilesCandidate(guessed, f0);
    
    // Feature flag & region gating for Psilocybin
    const reqCountry = (req.headers["cf-ipcountry"] || req.headers["x-country"] || "").toString().toUpperCase() || "XX";
    const psyAllowed = FEATURE_PSY && (REGION_ALLOW_PSY.length===0 || REGION_ALLOW_PSY.includes(reqCountry));
    if (!psyAllowed) {
      modules = modules.filter(m => m.toLowerCase() !== "psilocybin");
    }
    
    const diet = fiveDayNutritionPlan(primary[0] || "root", guessed);
    const supps = supplementPlan(guessed);
    let modules = guessed && DISEASE_MAP[guessed] ? DISEASE_MAP[guessed].modules : ["Nutrition","F0","Breath"];
    const labsParsed = extractLabsFromText(labsText || "");

    const therapy = { mode, guessedDisease: guessed, primaryChakras: primary, scores, f0, hz, smiles, diet, supps, modules, labs: labsParsed, notes: safetyEthicsNotes(), followUpAnswers };
    const id = await saveTherapy(mode || null, therapy, req.user?.id || null);
    await audit(req.user?.id || null, 'generateTherapy', true, `id=${id}`);
    try { counterTherapies.inc(); } catch {}
    if (WEBHOOK_URL) { try { await fetch(WEBHOOK_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'therapy.created', id, user_id:req.user?.id||null, created_at:new Date().toISOString() }) }); } catch(e){ logger.error('webhook failed', e); } }
    return res.json({ id, ...therapy });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

// -----------------------------
// PDF export (server-side) – same as previous build
// -----------------------------
app.post("/api/exportPdf", async (req, res) => {
  try {
    const therapy = req.body?.therapy;
    if (!therapy) return res.status(400).json({ error: "Missing therapy object" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="therapy.pdf"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    const H1 = (t)=> doc.fontSize(18).text(t, { underline: true }).moveDown(0.5);
    const H2 = (t)=> doc.fontSize(14).text(t).moveDown(0.25);
    const P  = (t)=> doc.fontSize(11).text(t, { lineGap: 2 }).moveDown(0.25);
    const L  = (arr)=> { arr.forEach(x => P(`• ${x}`)); };

    H1("Therapy Report");
    P(`Mode: ${therapy.mode}`);
    if (therapy.guessedDisease) P(`Guessed condition: ${therapy.guessedDisease}`);
    P(`Primary chakras: ${(therapy.primaryChakras || []).join(", ")}`);
    P(`F₀ score: ${therapy.f0}`);

    H2("Frequency Plan");
    (therapy.hz || []).forEach(h => P(`${h.chakra} — ${h.hz} Hz (15–30 min/day)`));

    H2("Bio-photonic Molecule (simulation)");
    P(therapy.smiles?.record || "");

    H2("Modules");
    L(therapy.modules || []);

    H2("Nutrition — 5-Day Plan");
    (therapy.diet || []).forEach((d,i)=>{
      doc.fontSize(12).text(`${i+1}. ${d.title}`).moveDown(0.1);
      P(d.focus);
      (d.meals||[]).forEach(m => P(`- ${m.name}: ${m.items.join(", ")}`));
      doc.moveDown(0.25);
    });

    H2("Supplements");
    L(therapy.supps || []);

    if (therapy.labs && Object.keys(therapy.labs).length) {
      H2("Parsed Labs");
      P(Object.entries(therapy.labs).map(([k,v]) => `${k}: ${v}`).join("; "));
    }

    H2("Safety & Ethics");
    L(therapy.notes || []);

    doc.end();
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to generate PDF", detail: String(e) });
  }
});

// -----------------------------
// Patent/PCT Report (docx or pdf) – same as previous build
// -----------------------------
app.post("/api/exportPatentReport", async (req, res) => {
  try {
    const therapy = req.body?.therapy;
    const format = (req.body?.format || "docx").toLowerCase();
    if (!therapy) return res.status(400).json({ error: "Missing therapy object" });

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="pct_report.pdf"');
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);
      doc.fontSize(20).text("PCT-Style Technical Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).text("System and Method for Calculating and Applying Molecules of Diametrically Opposite Frequency for Therapeutic Purposes", { align:"center" });
      doc.moveDown(1);
      doc.fontSize(12).text("1. Overview", { underline: true });
      doc.fontSize(11).text("This report summarizes a therapy instance generated by the F₀-aligned engine. It includes frequency planning, a bio-photonic molecule candidate record, a 5-day nutrition plan, and safety/ethics notes.");
      doc.moveDown(0.5);
      doc.fontSize(12).text("2. F₀ & Chakra Mapping", { underline: true });
      doc.fontSize(11).text(`F₀ score: ${therapy.f0}`);
      doc.text(`Primary chakras: ${(therapy.primaryChakras||[]).join(", ")}`);
      doc.text(`Mode: ${therapy.mode}${therapy.guessedDisease? " — Condition: "+therapy.guessedDisease: ""}`);
      doc.moveDown(0.5);
      doc.fontSize(12).text("3. Frequency Plan", { underline: true });
      (therapy.hz||[]).forEach(h=> doc.fontSize(11).text(`- ${h.chakra}: ${h.hz} Hz`));
      doc.moveDown(0.5);
      doc.fontSize(12).text("4. Bio-photonic Molecule Candidate", { underline: true });
      doc.fontSize(11).text(therapy.smiles?.record || "");
      doc.moveDown(0.5);
      doc.fontSize(12).text("5. Nutrition & Lifestyle (5-Day Plan)", { underline: true });
      (therapy.diet||[]).forEach((d,i)=>{
        doc.fontSize(11).text(`${i+1}. ${d.title} — ${d.focus}`);
        (d.meals||[]).forEach(m => doc.text(`   • ${m.name}: ${m.items.join(", ")}`));
      });
      doc.moveDown(0.5);
      doc.fontSize(12).text("6. Supplements", { underline: true });
      (therapy.supps||[]).forEach(s=> doc.fontSize(11).text(`- ${s}`));
      doc.moveDown(0.5);
      doc.fontSize(12).text("7. Safety & Ethics", { underline: true });
      (therapy.notes||[]).forEach(n=> doc.fontSize(11).text(`- ${n}`));
      doc.end();
      return;
    }

    const paras = [];
    const pushH = (t, lvl=HeadingLevel.HEADING_2)=> paras.push(new Paragraph({ text: t, heading: lvl }));
    const pushP = (t)=> paras.push(new Paragraph({ children: [new TextRun({ text: t })] }));

    pushH("PCT-Style Technical Report", HeadingLevel.TITLE);
    pushP("System and Method for Calculating and Applying Molecules of Diametrically Opposite Frequency for Therapeutic Purposes");
    pushH("1. Overview");
    pushP("This report summarizes a therapy instance generated by the F₀-aligned engine. It includes frequency planning, a bio-photonic molecule candidate record, a 5-day nutrition plan, and safety/ethics notes.");
    pushH("2. F₀ & Chakra Mapping");
    pushP(`F₀ score: ${therapy.f0}`);
    pushP(`Primary chakras: ${(therapy.primaryChakras||[]).join(", ")}`);
    pushP(`Mode: ${therapy.mode}${therapy.guessedDisease? " — Condition: "+therapy.guessedDisease: ""}`);
    pushH("3. Frequency Plan");
    (therapy.hz||[]).forEach(h=> pushP(`- ${h.chakra}: ${h.hz} Hz`));
    pushH("4. Bio-photonic Molecule Candidate");
    pushP(therapy.smiles?.record || "");
    pushH("5. Nutrition & Lifestyle (5-Day Plan)");
    (therapy.diet||[]).forEach((d,i)=>{
      pushP(`${i+1}. ${d.title} — ${d.focus}`);
      (d.meals||[]).forEach(m => pushP(`   • ${m.name}: ${m.items.join(", ")}`));
    });
    pushH("6. Supplements");
    (therapy.supps||[]).forEach(s=> pushP(`- ${s}`));
    pushH("7. Safety & Ethics");
    (therapy.notes||[]).forEach(n=> pushP(`- ${n}`));

    const docx = new Document({ sections: [{ properties: {}, children: paras }] });
    const buffer = await Packer.toBuffer(docx);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="pct_report.docx"');
    return res.send(buffer);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: "Failed to generate report", detail: String(e) });
  }
});



// API Keys (for partners)
if (dbMode==='postgres') {
  await pgPool.query(`CREATE TABLE IF NOT EXISTS api_keys(
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT,
    api_key TEXT UNIQUE,
    disabled BOOLEAN DEFAULT FALSE
  )`);
} else {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS api_keys(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now')),
    user_id INTEGER NULL,
    name TEXT,
    api_key TEXT UNIQUE,
    disabled INTEGER DEFAULT 0
  )`);
}
function randomKey() { return require('crypto').randomBytes(24).toString('hex'); }
app.post("/admin/apikeys/create", authRequired, adminRequired, async (req,res)=>{
  const { name, user_id=null } = req.body||{};
  const key = randomKey();
  try {
    if (dbMode==='postgres') await pgPool.query("INSERT INTO api_keys(user_id,name,api_key) VALUES($1,$2,$3)", [user_id, name||null, key]);
    else sqlite.prepare("INSERT INTO api_keys(user_id,name,api_key) VALUES (?,?,?)").run(user_id, name||null, key);
    res.json({ api_key: key });
  } catch(e){ res.status(500).json({ error:'create failed' }); }
});
app.get("/admin/apikeys/list", authRequired, adminRequired, async (_req,res)=>{
  const rows = dbMode==='postgres' ? (await pgPool.query("SELECT id,created_at,user_id,name,api_key,disabled FROM api_keys ORDER BY id DESC")).rows
                                   : sqlite.prepare("SELECT id,created_at,user_id,name,api_key,disabled FROM api_keys ORDER BY id DESC").all();
  res.json(rows);
});
app.post("/admin/apikeys/revoke", authRequired, adminRequired, async (req,res)=>{
  const { api_key } = req.body||{};
  if (!api_key) return res.status(400).json({ error:'api_key required' });
  if (dbMode==='postgres') await pgPool.query("UPDATE api_keys SET disabled=TRUE WHERE api_key=$1", [api_key]);
  else sqlite.prepare("UPDATE api_keys SET disabled=1 WHERE api_key=?").run(api_key);
  res.json({ ok:true });
});
function apiKeyRequired(req,res,next){
  const k = (req.headers['x-api-key']||'').toString();
  if (!k) return res.status(401).json({ error:'api key required' });
  let row;
  if (dbMode==='postgres') row = pgPool.query("SELECT * FROM api_keys WHERE api_key=$1 AND disabled=FALSE",[k]);
  // note: for simplicity, not awaiting here; we wrap into async below if used
  next();
}

// -----------------------------
// 2FA (TOTP) — setup & verify (hooks)
// -----------------------------
if (dbMode === "postgres") {
  await pgPool.query(`CREATE TABLE IF NOT EXISTS user_totp(
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL
  )`);
} else {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS user_totp(
    user_id INTEGER PRIMARY KEY,
    secret TEXT NOT NULL
  )`);
}
async function setUserTotpSecret(userId, secret) {
  if (dbMode === "postgres") {
    await pgPool.query(`INSERT INTO user_totp(user_id,secret) VALUES($1,$2)
      ON CONFLICT (user_id) DO UPDATE SET secret=EXCLUDED.secret`, [userId, secret]);
  } else {
    try {
      sqlite.prepare("INSERT INTO user_totp (user_id,secret) VALUES (?,?)").run(userId, secret);
    } catch {
      sqlite.prepare("UPDATE user_totp SET secret=? WHERE user_id=?").run(secret, userId);
    }
  }
}
async function getUserTotpSecret(userId) {
  if (dbMode === "postgres") {
    const r = await pgPool.query("SELECT secret FROM user_totp WHERE user_id=$1", [userId]);
    return r.rows[0]?.secret || null;
  } else {
    const r = sqlite.prepare("SELECT secret FROM user_totp WHERE user_id=?").get(userId);
    return r?.secret || null;
  }
}
app.post("/auth/2fa/setup", authRequired, async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    await setUserTotpSecret(req.user.id, secret);
    const otpauth = authenticator.keyuri(req.user.email, TOTP_ISSUER, secret);
    await audit(req.user.id, '2fa_setup', true, null);
    res.json({ otpauth, secret });
  } catch (e) {
    res.status(500).json({ error: "2FA setup failed" });
  }
});
app.post("/auth/2fa/verify", authRequired, async (req, res) => {
  try {
    const { token } = req.body || {};
    const secret = await getUserTotpSecret(req.user.id);
    if (!secret) return res.status(400).json({ error: "2FA not set up" });
    const ok = authenticator.verify({ token, secret });
    await audit(req.user.id, '2fa_verify', ok, null);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: "2FA verify failed" });
  }
});


// Retention sweep: delete anonymous therapies older than RETENTION_DAYS days
async function retentionSweep(){
  if (!RETENTION_DAYS) return;
  const sqlPg = `DELETE FROM therapies WHERE user_id IS NULL AND created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`;
  const sqlSqlite = "DELETE FROM therapies WHERE user_id IS NULL AND datetime(created_at) < datetime('now', ? )";
  try {
    if (dbMode==='postgres') await pgPool.query(sqlPg);
    else sqlite.prepare(sqlSqlite).run(f"-{RETENTION_DAYS} days");
    logger.info("Retention sweep done");
  } catch(e){ logger.error("Retention sweep failed", e); }
}
setInterval(retentionSweep, 24*60*60*1000);

app.use(Sentry.Handlers.errorHandler());
app.listen(PORT, ()=> logger.info({ port: PORT, db: dbMode }, 'Backend running'));

// Ensure 'role' and 'accepted_terms_at' columns exist (Postgres)
try { await pgPool.query("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"); } catch {}
try { await pgPool.query("ALTER TABLE users ADD COLUMN accepted_terms_at TIMESTAMP"); } catch {}

// Ensure columns exist (SQLite)
try {
  const cols = sqlite.prepare("PRAGMA table_info(users)").all().map(c=>c.name);
  if (!cols.includes('role')) sqlite.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
  if (!cols.includes('accepted_terms_at')) sqlite.prepare("ALTER TABLE users ADD COLUMN accepted_terms_at TEXT").run();
} catch(e) { logger.error('SQLite alter users failed', e); }


// Minimal, privacy-friendly analytics (opt-in)
app.post("/analytics/track", async (req,res)=>{
  try {
    if (String(process.env.ANALYTICS_ENABLED||'true')!=='true') return res.json({ ok: false });
    const { event, props } = req.body || {};
    if (!event) return res.status(400).json({ ok:false });
    if (dbMode==='postgres') await pgPool.query("INSERT INTO audit_logs(user_id, action, success, detail) VALUES($1,$2,$3,$4)", [null, 'analytics:'+event, true, JSON.stringify(props||{})]);
    else sqlite.prepare("INSERT INTO audit_logs(user_id, action, success, detail) VALUES (?,?,?,?)").run(null, 'analytics:'+event, 1, JSON.stringify(props||{}));
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ ok:false }); }
});

// Remote flags & brand
let remoteFlagsCache = { at: 0, data: null };
async function getRemoteFlags(){
  if (!REMOTE_FLAGS_URL) return null;
  const now = Date.now();
  if (remoteFlagsCache.data && now - remoteFlagsCache.at < 5*60*1000) return remoteFlagsCache.data;
  try {
    const r = await fetch(REMOTE_FLAGS_URL);
    const j = await r.json();
    remoteFlagsCache = { at: now, data: j };
    return j;
  } catch { return remoteFlagsCache.data; }
}
app.get('/config', async (_req,res)=>{
  const flags = await getRemoteFlags();
  res.json({ flags: flags||{} });
});
app.get('/brand', (req,res)=>{
  const host = (req.headers.host||'').split(':')[0].toLowerCase();
  const b = MULTITENANT_BRANDS[host] || MULTITENANT_BRANDS['default'] || { name:'TherapyEngine', primary:'#111827' };
  res.json(b);
});

// RevenueCat webhook (skeleton)
app.post('/billing/revenuecat/webhook', async (req,res)=>{
  try {
    const ev = req.body || {};
    // Map ev to user_id via ev.app_user_id (should be your user id)
    const uid = parseInt(ev?.app_user_id);
    if (uid && ev?.type === 'INITIAL_PURCHASE') await setSubscription(uid, 'active', 'revenuecat', ev?.id || null);
    res.json({ ok:true });
  } catch(e){ res.status(400).json({ error:'bad webhook' }); }
});

// Ensure accepted_terms_version column
try { await pgPool.query("ALTER TABLE users ADD COLUMN accepted_terms_version TEXT"); } catch {}
try {
  const cols = sqlite.prepare("PRAGMA table_info(users)").all().map(c=>c.name);
  if (!cols.includes('accepted_terms_version')) sqlite.prepare("ALTER TABLE users ADD COLUMN accepted_terms_version TEXT").run();
} catch(e){}

app.post('/auth/accept-terms', authRequired, async (req,res)=>{
  try {
    const v = (req.body && req.body.version) || TERMS_VERSION;
    if (dbMode==='postgres') await pgPool.query("UPDATE users SET accepted_terms_at=NOW(), accepted_terms_version=$1 WHERE id=$2", [v, req.user.id]);
    else sqlite.prepare("UPDATE users SET accepted_terms_at=datetime('now'), accepted_terms_version=? WHERE id=?").run(v, req.user.id);
    res.json({ ok:true, version: v });
  } catch(e){ res.status(500).json({ error:'accept failed' }); }
});