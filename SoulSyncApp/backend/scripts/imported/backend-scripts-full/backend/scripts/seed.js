// backend/scripts/seed.js
const { Client } = require("pg");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    const email = "admin@example.com";
    const password = crypto.randomBytes(12).toString("base64");
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4)`,
        [email, hashedPassword, "Admin User", "admin"]
      );
      console.log("✅ Seeded admin user:");
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log("ℹ️ Admin user already exists, skipping seed.");
    }

  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
