import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

async function connect(): Promise<Client> {
  const c = new Client({ connectionString: DATABASE_URL as string });
  await c.connect();
  return c;
}

async function siapkanData(c: Client) {
  await c.query('DELETE FROM booking.status_events');
  await c.query('DELETE FROM booking.bookings');
  await c.query('DELETE FROM booking.providers');
  await c.query('DELETE FROM booking.treatments');
  const providers: number[] = [];
  for (const nama of ['Provider A', 'Provider B', 'Provider C', 'Provider D', 'Provider E']) {
    const row = (await c.query(
      "INSERT INTO booking.providers (nama_internal, is_active, priority) VALUES ($1, true, $2) RETURNING id",
      [nama, providers.length + 1]
    )).rows[0];
    providers.push(row.id);
  }
  const treatment = (await c.query(
    "INSERT INTO booking.treatments (nama, is_active, durasi_menit, jeda_menit) VALUES ('Facial Brightening', true, 60, 0) RETURNING id"
  )).rows[0].id;
  return { providers, treatment };
}

const WA = '6281234567890';
const T1 = '2026-12-01 10:00:00+07';
const T2 = '2026-12-01 11:00:00+07';
const T3 = '2026-12-01 10:30:00+07';
const T4 = '2026-12-01 11:30:00+07';

async function insertBooking(
  c: Client,
  providerId: number,
  treatmentId: number,
  startsAt: string,
  endsAt: string,
  status: string,
  nama = 'Pelanggan Contoh'
) {
  return c.query(
    `INSERT INTO booking.bookings
       (nama, nomor_wa, treatment_id, provider_id, starts_at, ends_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [nama, WA, treatmentId, providerId, startsAt, endsAt, status]
  );
}

function butuhDb(t: { skip: () => void }) {
  if (!DATABASE_URL) {
    t.skip();
    return false;
  }
  return true;
}

test('booking_rules menyimpan nilai awal sesuai PRD', async (t) => {
  if (!butuhDb(t)) return;
  const c = await connect();
  try {
    const row = (await c.query(
      'SELECT slot_step_minutes, min_notice_hours, max_advance_days, max_active_per_wa FROM booking.booking_rules WHERE id = 1'
    )).rows[0];
    assert.strictEqual(row.slot_step_minutes, 30);
    assert.strictEqual(row.min_notice_hours, 3);
    assert.strictEqual(row.max_advance_days, 30);
    assert.strictEqual(row.max_active_per_wa, 2);
  } finally {
    await c.end();
  }
});

test('status booking hanya menerima nilai yang diizinkan', async (t) => {
  if (!butuhDb(t)) return;
  const c = await connect();
  try {
    const { providers, treatment } = await siapkanData(c);
    const statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    for (let i = 0; i < statuses.length; i += 1) {
      await insertBooking(c, providers[i], treatment, T1, T2, statuses[i]);
    }
    await assert.rejects(
      insertBooking(c, 1, 1, T1, T2, 'status_tidak_valid'),
      /check constraint|violates check/i
    );
  } finally {
    await c.end();
  }
});

test('exclusion constraint menolak dua booking aktif beririsan pada provider yang sama', async (t) => {
  if (!butuhDb(t)) return;
  const c = await connect();
  try {
    const { providers, treatment } = await siapkanData(c);
    const [p1] = providers;

    // Booking aktif pertama (pending) berhasil.
    await insertBooking(c, p1, treatment, T1, T2, 'pending');

    // Booking aktif kedua (pending) yang beririsan pada provider sama harus ditolak.
    await assert.rejects(
      insertBooking(c, p1, treatment, T3, T4, 'pending'),
      /exclusion/i
    );

    // Status non-aktif (cancelled/completed/no_show) tidak menghalangi interval baru pada provider sama.
    await insertBooking(c, p1, treatment, T3, T4, 'cancelled');
    await insertBooking(c, p1, treatment, T3, T4, 'completed');
    await insertBooking(c, p1, treatment, T3, T4, 'no_show');

    // Provider yang berbeda pada interval yang sama boleh.
    const [p2] = providers.slice(1);
    await insertBooking(c, p2, treatment, T1, T2, 'pending');

    // Booking yang bertemu tepat di batas (tidak tumpang tindih karena batas atas eksklusif) boleh.
    await insertBooking(c, p1, treatment, T2, '2026-12-01 12:00:00+07', 'pending');

    const jumlah = (await c.query('SELECT COUNT(*) AS n FROM booking.bookings')).rows[0].n;
    assert.strictEqual(Number(jumlah), 6);
  } finally {
    await c.end();
  }
});

test('dua transaksi bersamaan paling banyak satu booking aktif yang berhasil', async (t) => {
  if (!butuhDb(t)) return;
  const c = await connect();
  try {
    const { providers, treatment } = await siapkanData(c);
    const [p1] = providers;

    const c1 = await connect();
    const c2 = await connect();
    await c1.query("SET statement_timeout = '3s'");
    await c2.query("SET statement_timeout = '3s'");
    try {
      await c1.query('BEGIN');
      await c2.query('BEGIN');

      // Kedua transaksi mencoba memasang booking aktif yang tumpang tindih secara konkuren.
      const hasil1 = insertBooking(c1, p1, treatment, T1, T2, 'pending');
      const hasil2 = insertBooking(c2, p1, treatment, T1, T2, 'pending');
      const hasil = await Promise.allSettled([hasil1, hasil2]);

      let berhasil = 0;
      for (const [klien, hasilKlien] of [[c1, hasil[0]], [c2, hasil[1]]] as const) {
        if (hasilKlien.status === 'fulfilled') {
          try {
            await klien.query('COMMIT');
            berhasil += 1;
          } catch {
            await klien.query('ROLLBACK').catch(() => {});
          }
        } else {
          await klien.query('ROLLBACK').catch(() => {});
        }
      }

      assert.strictEqual(berhasil, 1, 'paling banyak satu booking aktif yang bertabrakan boleh berhasil');
    } finally {
      await c1.end();
      await c2.end();
    }
  } finally {
    await c.end();
  }
});

test('pemicu maksimal dua akun aktif aman terhadap transaksi bersamaan', async (t) => {
  if (!butuhDb(t)) return;
  const c = await connect();
  try {
    await c.query('DELETE FROM records.sessions');
    await c.query('DELETE FROM records.audit_logs');
    await c.query('DELETE FROM records.users');

    // Satu akun aktif sudah ada; ruang tersisa untuk satu akun aktif tambahan.
    await c.query(
      "INSERT INTO records.users (nama, identitas_login, password_hash, status) VALUES ('User Satu', 'user_satu', 'hash_satu', 'active')"
    );

    const c1 = await connect();
    const c2 = await connect();
    await c1.query("SET statement_timeout = '3s'");
    await c2.query("SET statement_timeout = '3s'");
    try {
      await c1.query('BEGIN');
      await c2.query('BEGIN');

      const hasil1 = c1.query(
        "INSERT INTO records.users (nama, identitas_login, password_hash, status) VALUES ('User Dua', 'user_dua', 'hash_dua', 'active')"
      );
      const hasil2 = c2.query(
        "INSERT INTO records.users (nama, identitas_login, password_hash, status) VALUES ('User Tiga', 'user_tiga', 'hash_tiga', 'active')"
      );
      const hasil = await Promise.allSettled([hasil1, hasil2]);

      let berhasil = 0;
      for (const [klien, hasilKlien] of [[c1, hasil[0]], [c2, hasil[1]]] as const) {
        if (hasilKlien.status === 'fulfilled') {
          try {
            await klien.query('COMMIT');
            berhasil += 1;
          } catch {
            await klien.query('ROLLBACK').catch(() => {});
          }
        } else {
          await klien.query('ROLLBACK').catch(() => {});
        }
      }

      assert.strictEqual(berhasil, 1, 'paling banyak satu akun aktif tambahan boleh berhasil');
    } finally {
      await c1.end();
      await c2.end();
    }

    const total = (await c.query("SELECT COUNT(*) n FROM records.users WHERE status = 'active'")).rows[0].n;
    assert.strictEqual(Number(total), 2, 'maksimal dua akun aktif terpenuhi setelah konkuren');
  } finally {
    await c.end();
  }
});
