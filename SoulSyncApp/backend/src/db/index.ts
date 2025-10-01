import fs from 'fs-extra'
import path from 'path'
import Database from 'better-sqlite3'
import { Client } from 'pg'

const SQLITE_PATH = path.join(process.cwd(), 'data', 'soulsync.db')
fs.ensureDirSync(path.dirname(SQLITE_PATH))

export type User = { id: string, email: string, passwordHash: string, createdAt: string }

const PG_URL = process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL

const isPG = !!PG_URL

// --- SQLite setup ---
let sqlite: Database.Database | null = null
if (!isPG) {
  sqlite = new Database(SQLITE_PATH)
  sqlite.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`)
}

// --- Postgres helpers ---
let pg: Client | null = null
async function ensurePG() {
  if (!pg && isPG) {
    pg = new Client({ connectionString: PG_URL })
    await pg.connect()
    await pg.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`)
  }
}

export async function createUser(u: User) {
  if (isPG) {
    await ensurePG()
    await pg!.query('INSERT INTO users (id,email,passwordHash,createdAt) VALUES ($1,$2,$3,$4)', [u.id, u.email, u.passwordHash, u.createdAt])
  } else {
    const stmt = sqlite!.prepare('INSERT INTO users (id,email,passwordHash,createdAt) VALUES (?,?,?,?)')
    stmt.run(u.id, u.email.toLowerCase(), u.passwordHash, u.createdAt)
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (isPG) {
    await ensurePG()
    const r = await pg!.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email])
    return r.rows[0] || null
  } else {
    const stmt = sqlite!.prepare('SELECT * FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1')
    const row = stmt.get(email)
    return row || null
  }
}

export async function pingDB(){
  if (isPG) { await ensurePG(); await pg!.query('SELECT 1'); }
  else { ensureSQLite(); sqlite!.prepare('SELECT 1').get(); }
}

export async function ensureSQLite(){ if(!sqlite){ sqlite = new Database(SQLITE_PATH); sqlite.pragma('journal_mode = WAL'); } }
