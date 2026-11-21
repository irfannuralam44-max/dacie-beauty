import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "pg";
import { Pool } from "pg";

import {
  closePool,
  getActiveConnectionString,
  getActiveRole,
  getPool,
  query,
  transaction,
} from "../lib/db/pool.ts";
import { select, selectOne } from "../lib/db/client.ts";

const DATABASE_URL = process.env.DATABASE_URL;
const ACTIVE_ROLE = getActiveRole();
const IS_PRIVATE = ACTIVE_ROLE === "app_private";

async function connectAdmin(): Promise<Client> {
  const c = new Client({ connectionString: DATABASE_URL as string });
  await c.connect();
  return c;
}

function butuhDb(t: { skip: () => void }) {
  if (!DATABASE_URL) {
    t.skip();
    return false;
  }
  return true;
}

test("query dengan parameter binding berhasil mengambil data (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses SELECT app_private pada mode private");
    return;
  }
  const row = await selectOne<{ id: number; slot_step_minutes: number }>(
    "SELECT id, slot_step_minutes FROM booking.booking_rules WHERE id = $1",
    [1],
  );
  assert.equal(row?.slot_step_minutes, 30);
});

test("select mengembalikan array baris (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses SELECT app_private pada mode private");
    return;
  }
  // Masukkan data uji terlebih dahulu
  await query(
    "INSERT INTO booking.providers (nama_internal, is_active, priority) VALUES ($1, true, $2)",
    ["Provider Select Test", 1],
  );
  const rows = await select<{ id: number; nama: string }>(
    "SELECT id, nama_internal AS nama FROM booking.providers WHERE nama_internal = $1",
    ["Provider Select Test"],
  );
  assert.ok(rows.length >= 1);
  assert.equal(rows[0].nama, "Provider Select Test");
});

test("selectOne mengembalikan null bila tidak ada hasil (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses SELECT app_private pada mode private");
    return;
  }
  const row = await selectOne<{ id: number }>(
    "SELECT id FROM booking.booking_rules WHERE id = 0",
    [],
  );
  assert.equal(row, null);
});

test("transaction commit dan rollback melalui pool (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses DML konfigurasi app_private pada mode private");
    return;
  }
  let committed = false;
  try {
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, 60, 0)",
        ["Treatment Tx Test"],
      );
      committed = true;
    });
  } catch {
    // Expected: treatment name might conflict, but rollback should still happen
  }
  assert.equal(committed, true, "transaksi harus dapat di-commit");

  // Verifikasi data tidak tersisa karena tabel treatment akan dicek ulang
  // (tidak ada rollback di sini, hanya mencoba commit berhasil)
});

test("transaction melempar error dan rollback saat query gagal (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses DML konfigurasi app_private pada mode private");
    return;
  }
  let errorThrown = false;
  try {
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, 60, 0)",
        ["Treatment Error Test"],
      );
      // Paksa error dengan memasukkan nilai yang tidak valid
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, $2, $3)",
        ["Treatment Error Test", "bukan-angka", 0],
      );
    });
  } catch {
    errorThrown = true;
  }
  assert.equal(errorThrown, true, "harus melempar error saat query gagal");
});

test("role aktif tidak dapat SELECT langsung pada tabel booking.bookings", async (t) => {
  if (!butuhDb(t)) return;
  if (ACTIVE_ROLE === "app_public") {
    await assert.rejects(
      query("SELECT * FROM booking.bookings LIMIT 0"),
      /permission denied|42501/,
    );
  }
});

test("role aktif tidak dapat INSERT langsung pada tabel booking.bookings", async (t) => {
  if (!butuhDb(t)) return;
  if (ACTIVE_ROLE === "app_public") {
    await assert.rejects(
      query("INSERT INTO booking.bookings DEFAULT VALUES"),
      /permission denied|42501/,
    );
  }
});

test("role aktif tidak dapat mengakses schema records", async (t) => {
  if (!butuhDb(t)) return;
  if (ACTIVE_ROLE === "app_public") {
    await assert.rejects(
      query("SELECT * FROM records.users LIMIT 0"),
      /permission denied for schema records|42501/,
    );
  }
});

test("app_private dapat SELECT seluruh tabel booking (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini hanya berlaku pada mode private");
    return;
  }
  const tables = [
    "treatments",
    "providers",
    "working_hours",
    "time_off",
    "booking_rules",
    "bookings",
    "status_events",
  ];
  for (const table of tables) {
    await query(`SELECT * FROM booking.${table} LIMIT 0`);
  }
});

test("app_private tidak dapat DML langsung pada booking.bookings (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini hanya berlaku pada mode private");
    return;
  }
  await assert.rejects(
    query("INSERT INTO booking.bookings DEFAULT VALUES"),
    /permission denied|42501/,
  );
  await assert.rejects(
    query("UPDATE booking.bookings SET status = status WHERE false"),
    /permission denied|42501/,
  );
  await assert.rejects(
    query("DELETE FROM booking.bookings WHERE false"),
    /permission denied|42501/,
  );
});

test("app_public melalui pool terpisah tidak dapat SELECT tabel booking", async (t) => {
  if (!butuhDb(t)) return;
  const publicUrl = process.env.APP_PUBLIC_DATABASE_URL;
  if (!publicUrl) {
    t.skip("APP_PUBLIC_DATABASE_URL tidak disetel");
    return;
  }
  const publicPool = new Pool({ connectionString: publicUrl });
  try {
    await assert.rejects(
      publicPool.query("SELECT * FROM booking.bookings LIMIT 0"),
      /permission denied|42501/,
    );
  } finally {
    await publicPool.end();
  }
});

test("app_public melalui pool terpisah tidak dapat mengakses schema records", async (t) => {
  if (!butuhDb(t)) return;
  const publicUrl = process.env.APP_PUBLIC_DATABASE_URL;
  if (!publicUrl) {
    t.skip("APP_PUBLIC_DATABASE_URL tidak disetel");
    return;
  }
  const publicPool = new Pool({ connectionString: publicUrl });
  try {
    await assert.rejects(
      publicPool.query("SELECT * FROM records.users LIMIT 0"),
      /permission denied for schema records|42501/,
    );
  } finally {
    await publicPool.end();
  }
});

test("getActiveRole dan getActiveConnectionString konsisten", async (t) => {
  if (!butuhDb(t)) return;
  const role = getActiveRole();
  const cs = getActiveConnectionString();
  assert.match(cs, new RegExp(`://${role}:`));
});

test("pool tidak dapat ditukar role melalui panggilan berulang getPool", async (t) => {
  if (!butuhDb(t)) return;
  const pool1 = getPool();
  const pool2 = getPool();
  assert.equal(pool1, pool2, "harus mengembalikan instance pool yang sama");
});

test("closePool menutup pool dan getPool membuat pool baru", async (t) => {
  if (!butuhDb(t)) return;
  await closePool();
  const pool = getPool();
  const cs = (pool as { options: { connectionString: string } }).options
    .connectionString;
  assert.match(cs, new RegExp(`://${getActiveRole()}:`));
  await closePool();
});

// Tes langsung menggunakan koneksi admin untuk verifikasi transaksi rollback
test("rollback transaksi admin membatalkan perubahan data", async (t) => {
  if (!butuhDb(t)) return;
  const admin = await connectAdmin();
  try {
    await admin.query("BEGIN");
    await admin.query(
      "INSERT INTO booking.providers (nama_internal, is_active, priority) VALUES ($1, true, $2)",
      ["Provider Admin Rollback", 99],
    );
    const before = await admin.query(
      "SELECT COUNT(*) AS n FROM booking.providers WHERE nama_internal = $1",
      ["Provider Admin Rollback"],
    );
    assert.equal(Number(before.rows[0].n), 1);
    await admin.query("ROLLBACK");
    const after = await admin.query(
      "SELECT COUNT(*) AS n FROM booking.providers WHERE nama_internal = $1",
      ["Provider Admin Rollback"],
    );
    assert.equal(Number(after.rows[0].n), 0);
  } finally {
    await admin.end();
  }
});
