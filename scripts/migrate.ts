import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";

const databaseUrl = process.env.COMMAND_CENTER_DATABASE_URL;

if (databaseUrl === undefined) {
  throw new Error("COMMAND_CENTER_DATABASE_URL is required");
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const migrationDirectory = join(process.cwd(), "database", "init");
const migrationFiles = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith(".sql") && !file.includes("_seed"))
  .sort();

try {
  for (const migrationFile of migrationFiles) {
    const sql = await readFile(join(migrationDirectory, migrationFile), "utf8");
    await pool.query(sql);
    process.stdout.write(`Applied ${migrationFile}\n`);
  }
} finally {
  await pool.end();
}
