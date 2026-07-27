import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/lib/db";

async function main() {
  const migrationPath = path.join(process.cwd(), "migrations", "001_initial.sql");
  const sql = await readFile(migrationPath, "utf8");
  await pool.query(sql);
  console.log("Migração concluída com sucesso.");
  await pool.end();
}

main().catch(async (error) => {
  console.error("Falha na migração:", error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
