import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MIGRATION_DIR = path.join(ROOT, 'db', 'migrations');

async function ensureSchemaTracking(client) {
  await client.query('CREATE SCHEMA IF NOT EXISTS booking;');
  let applied = new Set();
  try {
    const rows = await client.query(
      'SELECT version FROM booking.schema_migrations ORDER BY version'
    );
    applied = new Set(rows.rows.map((row) => row.version));
  } catch {
    // Tabel pelacakan belum ada: migrasi pertama belum pernah dijalankan.
  }
  return applied;
}

async function listMigrationFiles() {
  return fs.readdirSync(MIGRATION_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

async function applyPending(client, applied) {
  const files = await listMigrationFiles();
  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[LEWAT]    ${file} (sudah diterapkan)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATION_DIR, file), 'utf8');

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO booking.schema_migrations (version, name) VALUES ($1, $2)',
        [file, file]
      );
      await client.query('COMMIT');
      console.log(`[TERAPKAN] ${file}`);
      appliedCount += 1;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[GAGAL]    ${file}: ${err.message}`);
      process.exit(1);
    }
  }

  return { files, appliedCount };
}

async function printStatus(client, applied) {
  const files = await listMigrationFiles();
  for (const file of files) {
    console.log(`${applied.has(file) ? '[TERAPKAN]' : '[BELUM]   '} ${file}`);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: variabel environment DATABASE_URL harus diatur.');
    process.exit(1);
  }

  const command = process.argv[2];

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const applied = await ensureSchemaTracking(client);

    if (command === 'status') {
      await printStatus(client, applied);
      return;
    }

    const { files, appliedCount } = await applyPending(client, applied);

    if (appliedCount === 0) {
      console.log('Tidak ada migrasi baru yang perlu diterapkan.');
    } else {
      console.log(`Berhasil menerapkan ${appliedCount} dari ${files.length} migrasi.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
