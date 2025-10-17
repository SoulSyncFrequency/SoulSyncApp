// backend/scripts/check-admin.js
const { Client } = require("pg");

async function checkAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    const result = await client.query(
      "SELECT id, email, role, created_at FROM users WHERE email = $1",
      ["admin@example.com"]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("✅ Admin user found:");
      console.log(`   id: ${user.id}`);
      console.log(`   email: ${user.email}`);
      console.log(`   role: ${user.role}`);
      console.log(`   created_at: ${user.created_at}`);
    } else {
      console.log("❌ Admin user not found!");
    }

  } catch (err) {
    console.error("❌ Failed to check admin user:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkAdmin();
