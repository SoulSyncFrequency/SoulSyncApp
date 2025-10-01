import { pool } from "../db";
(async function(){
  const q=await pool.query("SELECT data, created_at FROM config_backups ORDER BY created_at DESC LIMIT 1");
  if(!q.rows.length){ console.log("No backups found."); return; }
  console.log("Latest backup at:", q.rows[0].created_at);
  console.log(JSON.stringify(q.rows[0].data,null,2));
})().catch(e=>{ console.error(e); process.exit(1); });
