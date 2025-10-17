import os, psycopg2
DDL_PATH = os.path.join(os.path.dirname(__file__), "001_init.sql")
DATABASE_URL = os.getenv("AIOPS_DATABASE_URL") or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("AIOPS_DATABASE_URL/DATABASE_URL not set")
sql = open(DDL_PATH, "r", encoding="utf-8").read()
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
with conn, conn.cursor() as cur:
    cur.execute(sql)
print("Migration applied.")
