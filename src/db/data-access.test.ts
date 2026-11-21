import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Client, type PoolClient } from "pg";
import { Pool } from "pg";

import {
  closePool,
  getPool,
  isPrivatePool,
  isPublicPool,
  query,
  transaction,
} from "../lib/db/pool.ts";
import { select } from "../lib/db/client.ts";

const DATABASE_URL = process.env.DATABASE_URL;
const IS_PRIVATE = isPrivatePool();
const IS_PUBLIC = isPublicPool();

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

async function insertProvider(client: Client | PoolClient, nama: string, priority: number) {
  await client.query(
    "INSERT INTO booking.providers (nama_internal, is_active, priority) VALUES ($1, true, $2)",
    [nama, priority],
  );
}

async function countProviderByName(client: Client | PoolClient, nama: string): Promise<number> {
  const result = await client.query(
    "SELECT COUNT(*) AS n FROM booking.providers WHERE nama_internal = $1",
    [nama],
  );
  return Number(result.rows[0].n);
}

async function cleanupProviderByName(client: Client, nama: string) {
  await client.query(
    "DELETE FROM booking.providers WHERE nama_internal = $1",
    [nama],
  );
}

// --- Query dan select (hanya mode private karena app_public tidak punya SELECT tabel) ---

test("query dengan parameter binding berhasil mengambil data (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses SELECT app_private pada mode private");
    return;
  }
  const { selectOne } = await import("../lib/db/client.ts");
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
  const nama = "Provider Select Test";
  const admin = await connectAdmin();
  try {
    await insertProvider(admin, nama, 1);
    const rows = await select<{ id: number; nama: string }>(
      "SELECT id, nama_internal AS nama FROM booking.providers WHERE nama_internal = $1",
      [nama],
    );
    assert.ok(rows.length >= 1);
    assert.equal(rows[0].nama, nama);
  } finally {
    await cleanupProviderByName(admin, nama);
    await admin.end();
  }
});

test("selectOne mengembalikan null bila tidak ada hasil (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses SELECT app_private pada mode private");
    return;
  }
  const { selectOne } = await import("../lib/db/client.ts");
  const row = await selectOne<{ id: number }>(
    "SELECT id FROM booking.booking_rules WHERE id = 0",
    [],
  );
  assert.equal(row, null);
});

// --- Transaksi dengan wrapper transaction() ---

test("transaction commit melalui wrapper menyimpan data (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses DML konfigurasi app_private pada mode private");
    return;
  }
  const nama = "Treatment Tx Commit Test";
  const admin = await connectAdmin();
  try {
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, 60, 0)",
        [nama],
      );
    });

    // Verifikasi data tersimpan setelah commit
    // treatment, bukan provider, so kita pakai query langsung
    const result = await admin.query(
      "SELECT COUNT(*) AS n FROM booking.treatments WHERE nama = $1",
      [nama],
    );
    assert.equal(Number(result.rows[0].n), 1);
  } finally {
    await admin.query("DELETE FROM booking.treatments WHERE nama = $1", [nama]);
    await admin.end();
  }
});

test("transaction melempar error dan rollback membatalkan semua data (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses DML konfigurasi app_private pada mode private");
    return;
  }
  const nama1 = "Treatment Rollback First";
  const nama2 = "Treatment Rollback Second";
  let errorThrown = false;

  try {
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, 60, 0)",
        [nama1],
      );
      // Paksa error dengan memasukkan nilai yang tidak valid untuk kolom integer
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, $2, $3)",
        [nama2, "bukan-angka", 0],
      );
    });
  } catch {
    errorThrown = true;
  }

  assert.equal(errorThrown, true, "harus melempar error saat query dalam transaksi gagal");

  // Verifikasi dari query terpisah bahwa data pertama TIDAK tersimpan (rollback berhasil)
  const admin = await connectAdmin();
  try {
    const n1 = await admin.query(
      "SELECT COUNT(*) AS n FROM booking.treatments WHERE nama = $1",
      [nama1],
    );
    const n2 = await admin.query(
      "SELECT COUNT(*) AS n FROM booking.treatments WHERE nama = $1",
      [nama2],
    );
    assert.equal(Number(n1.rows[0].n), 0, "data pertama harus dibatalkan oleh rollback");
    assert.equal(Number(n2.rows[0].n), 0, "data kedua juga harus dibatalkan oleh rollback");
  } finally {
    await admin.end();
  }
});

test("koneksi dapat digunakan kembali setelah transaction gagal dan rollback (mode private)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PRIVATE) {
    t.skip("tes ini memerlukan akses DML konfigurasi app_private pada mode private");
    return;
  }
  const nama = "Treatment Reuse Test";
  let errorThrown = false;

  try {
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, 60, 0)",
        [nama],
      );
      // Paksa error
      await client.query(
        "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, $2, $3)",
        [nama, "bukan-angka", 0],
      );
    });
  } catch {
    errorThrown = true;
  }
  assert.equal(errorThrown, true);

  // Koneksi dapat digunakan kembali untuk transaksi baru yang berhasil
  const nama2 = "Treatment Reuse Success";
  await transaction(async (client) => {
    await client.query(
      "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ($1, true, 60, 0)",
      [nama2],
    );
  });

  const admin = await connectAdmin();
  try {
    const result = await admin.query(
      "SELECT COUNT(*) AS n FROM booking.treatments WHERE nama = $1",
      [nama2],
    );
    assert.equal(Number(result.rows[0].n), 1);
  } finally {
    await admin.query("DELETE FROM booking.treatments WHERE nama IN ($1, $2)", [nama, nama2]);
    await admin.end();
  }
});

// --- Pemisahan role: public tidak boleh mengakses pool privat / tabel privat ---

test("role aktif tidak dapat SELECT langsung pada tabel booking.bookings (mode public)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PUBLIC) {
    t.skip("tes ini hanya berlaku pada mode public");
    return;
  }
  await assert.rejects(
    query("SELECT * FROM booking.bookings LIMIT 0"),
    /permission denied|42501/,
  );
});

test("role aktif tidak dapat INSERT langsung pada tabel booking.bookings (mode public)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PUBLIC) {
    t.skip("tes ini hanya berlaku pada mode public");
    return;
  }
  await assert.rejects(
    query("INSERT INTO booking.bookings DEFAULT VALUES"),
    /permission denied|42501/,
  );
});

test("role aktif tidak dapat mengakses schema records (mode public)", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PUBLIC) {
    t.skip("tes ini hanya berlaku pada mode public");
    return;
  }
  await assert.rejects(
    query("SELECT * FROM records.users LIMIT 0"),
    /permission denied for schema records|42501/,
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

test("instance public tidak dapat membuat pool privat melalui import tidak disengaja", async (t) => {
  if (!butuhDb(t)) return;
  if (!IS_PUBLIC) {
    t.skip("tes ini hanya berlaku pada mode public");
    return;
  }
  // createPool tidak diekspor melalui API publik, sehingga tidak bisa
  // membuat pool dengan DSN privat secara tidak disengaja
  const indexSource = readFileSync(new URL("../lib/db/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(indexSource, /\bcreatePool\b/);
  // getPool selalu mengembalikan pool public, bukan privat
  const pool = getPool();
  assert.ok(pool);
  // Tidak ada cara untuk menukar role melalui getPool berulang kali
  const pool2 = getPool();
  assert.equal(pool, pool2);
});

// --- app_private memiliki akses yang sesuai (hanya mode private) ---

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

// --- Konsistensi pool ---

test("getPool mengembalikan instance yang sama (singleton)", async (t) => {
  if (!butuhDb(t)) return;
  const pool1 = getPool();
  const pool2 = getPool();
  assert.equal(pool1, pool2);
});

test("closePool menutup pool dan getPool membuat pool baru", async (t) => {
  if (!butuhDb(t)) return;
  await closePool();
  const pool = getPool();
  assert.ok(pool);
  await closePool();
});

// --- Rollback transaksi menggunakan koneksi admin (verifikasi tambahan) ---

test("rollback transaksi admin membatalkan perubahan data", async (t) => {
  if (!butuhDb(t)) return;
  const admin = await connectAdmin();
  try {
    await admin.query("BEGIN");
    await insertProvider(admin, "Provider Admin Rollback", 99);
    const before = await countProviderByName(admin, "Provider Admin Rollback");
    assert.equal(before, 1);
    await admin.query("ROLLBACK");
    const after = await countProviderByName(admin, "Provider Admin Rollback");
    assert.equal(after, 0);
  } finally {
    await admin.end();
  }
});
