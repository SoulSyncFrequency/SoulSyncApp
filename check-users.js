// backend/scripts/check-users.js
const { Client } = require("pg");

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("✅ Connected to database");

    const result = await client.query(
      "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    if (result.rows.length > 0) {
      console.log(`ℹ️ Found ${result.rows.length} user(s):`);
      result.rows.forEach((user, i) => {
        console.log(`\nUser ${i + 1}:`);
        console.log(`   id: ${user.id}`);
        console.log(`   email: ${user.email}`);
        console.log(`   role: ${user.role}`);
        console.log(`   created_at: ${user.created_at}`);
      });
    } else {
      console.log("❌ No users found in the database!");
    }
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkUsers();
