import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";

const databaseUrl = process.env.COMMAND_CENTER_DATABASE_URL;

if (databaseUrl === undefined) {
  throw new Error("COMMAND_CENTER_DATABASE_URL is required");
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const seedFile = join(
  process.cwd(),
  "database",
  "init",
  "002_fixture_seed.sql",
);

try {
  await pool.query(await readFile(seedFile, "utf8"));
  process.stdout.write("Fixture records seeded\n");
} finally {
  await pool.end();
}
