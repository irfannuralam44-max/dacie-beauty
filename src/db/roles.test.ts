import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';

const ADMIN_URL = process.env.DATABASE_URL;
const PUBLIC_URL = process.env.APP_PUBLIC_DATABASE_URL;
const PRIVATE_URL = process.env.APP_PRIVATE_DATABASE_URL;

async function connect(connectionString: string): Promise<Client> {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

function skipIfMissing(t: { skip: (message?: string) => void }, value: string | undefined, name: string) {
  if (!value) {
    t.skip(`Lewati: ${name} belum disetel.`);
    return false;
  }
  return true;
}

async function listTables(client: Client, schema: string) {
  const result = await client.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name`,
    [schema],
  );
  return result.rows.map((row: { table_name: string }) => row.table_name as string);
}

test('app_public dengan kredensial nyata ditolak SELECT dan INSERT pada setiap tabel', async (t) => {
  if (!skipIfMissing(t, ADMIN_URL, 'DATABASE_URL') ||
      !skipIfMissing(t, PUBLIC_URL, 'APP_PUBLIC_DATABASE_URL')) return;

  const admin = await connect(ADMIN_URL as string);
  const publicClient = await connect(PUBLIC_URL as string);
  try {
    for (const schema of ['booking', 'records']) {
      const tables = await listTables(admin, schema);
      for (const table of tables) {
        await assert.rejects(
          publicClient.query(`SELECT * FROM "${schema}"."${table}" LIMIT 0`),
          (error: { code?: string }) => error.code === '42501',
          `app_public tidak boleh SELECT ${schema}.${table}`,
        );
        await assert.rejects(
          publicClient.query(`INSERT INTO "${schema}"."${table}" DEFAULT VALUES`),
          (error: { code?: string }) => error.code === '42501',
          `app_public tidak boleh INSERT ${schema}.${table}`,
        );
      }
    }

    const schemaUsage = await publicClient.query(
      "SELECT has_schema_privilege(current_user, 'records', 'USAGE') AS records_usage",
    );
    assert.equal(schemaUsage.rows[0].records_usage, false);
  } finally {
    await publicClient.end();
    await admin.end();
  }
});

test('app_private dengan kredensial nyata hanya mendapat DML booking pada tabel konfigurasi', async (t) => {
  if (!skipIfMissing(t, PRIVATE_URL, 'APP_PRIVATE_DATABASE_URL')) return;
  const client = await connect(PRIVATE_URL as string);
  try {
    const bookingTables = await listTables(client, 'booking');
    for (const table of bookingTables) {
      await client.query(`SELECT * FROM booking."${table}" LIMIT 0`);
    }

    for (const table of ['treatments', 'providers', 'working_hours', 'time_off', 'booking_rules']) {
      const privileges = await client.query(
        `SELECT
           has_table_privilege(current_user, 'booking."${table}"', 'INSERT') AS can_insert,
           has_table_privilege(current_user, 'booking."${table}"', 'UPDATE') AS can_update,
           has_table_privilege(current_user, 'booking."${table}"', 'DELETE') AS can_delete`,
      );
      assert.equal(privileges.rows[0].can_insert, true, `${table}: INSERT`);
      assert.equal(privileges.rows[0].can_update, true, `${table}: UPDATE`);
      assert.equal(privileges.rows[0].can_delete, false, `${table}: DELETE`);
    }

    await assert.rejects(
      client.query('INSERT INTO booking.bookings DEFAULT VALUES'),
      (error: { code?: string }) => error.code === '42501',
    );
    await assert.rejects(
      client.query('UPDATE booking.bookings SET status = status WHERE false'),
      (error: { code?: string }) => error.code === '42501',
    );
    await assert.rejects(
      client.query('DELETE FROM booking.bookings WHERE false'),
      (error: { code?: string }) => error.code === '42501',
    );

    const recordsTables = await listTables(client, 'records');
    for (const table of recordsTables) {
      const privileges = await client.query(
        `SELECT
           has_table_privilege(current_user, 'records."${table}"', 'SELECT') AS can_select,
           has_table_privilege(current_user, 'records."${table}"', 'INSERT') AS can_insert,
           has_table_privilege(current_user, 'records."${table}"', 'UPDATE') AS can_update,
           has_table_privilege(current_user, 'records."${table}"', 'DELETE') AS can_delete`,
      );
      for (const privilege of Object.values(privileges.rows[0])) {
        assert.equal(privilege, true, `app_private harus memiliki DML pada records.${table}`);
      }
    }
  } finally {
    await client.end();
  }
});

test('kedua function owner NOLOGIN, bukan superuser, dan hanya memiliki privilege yang ditetapkan', async (t) => {
  if (!skipIfMissing(t, ADMIN_URL, 'DATABASE_URL')) return;
  const client = await connect(ADMIN_URL as string);
  try {
    const roles = await client.query(
      `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
         FROM pg_catalog.pg_roles
        WHERE rolname IN ('booking_public_fn_owner', 'booking_private_fn_owner')`,
    );
    assert.equal(roles.rows.length, 2);
    for (const role of roles.rows) {
      assert.equal(role.rolcanlogin, false);
      assert.equal(role.rolsuper, false);
      assert.equal(role.rolcreatedb, false);
      assert.equal(role.rolcreaterole, false);
      assert.equal(role.rolreplication, false);
      assert.equal(role.rolbypassrls, false);
    }

    await client.query('SET ROLE booking_public_fn_owner');
    const publicOwner = await client.query(
      `SELECT
         has_schema_privilege(current_user, 'booking', 'USAGE') AS booking_usage,
         has_schema_privilege(current_user, 'records', 'USAGE') AS records_usage,
         has_table_privilege(current_user, 'booking.treatments', 'SELECT') AS config_select,
         has_table_privilege(current_user, 'booking.treatments', 'UPDATE') AS config_update,
         has_table_privilege(current_user, 'booking.bookings', 'SELECT') AS bookings_select,
         has_table_privilege(current_user, 'booking.bookings', 'INSERT') AS bookings_insert,
         has_table_privilege(current_user, 'booking.bookings', 'UPDATE') AS bookings_update,
         has_table_privilege(current_user, 'booking.bookings', 'DELETE') AS bookings_delete`,
    );
    assert.deepEqual(publicOwner.rows[0], {
      booking_usage: true,
      records_usage: false,
      config_select: true,
      config_update: false,
      bookings_select: true,
      bookings_insert: true,
      bookings_update: false,
      bookings_delete: false,
    });
    await client.query('RESET ROLE');

    await client.query('SET ROLE booking_private_fn_owner');
    const privateOwner = await client.query(
      `SELECT
         has_schema_privilege(current_user, 'booking', 'USAGE') AS booking_usage,
         has_schema_privilege(current_user, 'records', 'USAGE') AS records_usage,
         has_table_privilege(current_user, 'booking.bookings', 'SELECT') AS bookings_select,
         has_table_privilege(current_user, 'booking.bookings', 'UPDATE') AS table_update,
         has_column_privilege(current_user, 'booking.bookings', 'status', 'UPDATE') AS status_update,
         has_column_privilege(current_user, 'booking.bookings', 'nama', 'UPDATE') AS name_update,
         has_table_privilege(current_user, 'booking.status_events', 'INSERT') AS events_insert,
         has_table_privilege(current_user, 'booking.status_events', 'SELECT') AS events_select`,
    );
    assert.deepEqual(privateOwner.rows[0], {
      booking_usage: true,
      records_usage: false,
      bookings_select: true,
      table_update: false,
      status_update: true,
      name_update: false,
      events_insert: true,
      events_select: false,
    });
    await client.query('RESET ROLE');
  } finally {
    await client.query('RESET ROLE').catch(() => {});
    await client.end();
  }
});

test('default privileges tidak membuka akses berlebih pada objek baru', async (t) => {
  if (!skipIfMissing(t, ADMIN_URL, 'DATABASE_URL')) return;
  const client = await connect(ADMIN_URL as string);
  try {
    await client.query('BEGIN');
    await client.query('CREATE TABLE booking.__t005_default_acl_probe (id bigserial PRIMARY KEY)');
    await client.query('CREATE TABLE records.__t005_default_acl_probe (id bigserial PRIMARY KEY)');
    await client.query(
      'CREATE FUNCTION booking.__t005_default_acl_probe_fn() RETURNS integer LANGUAGE sql AS $$ SELECT 1 $$',
    );

    const bookingAcl = await client.query(
      `SELECT
         has_table_privilege('app_private', 'booking.__t005_default_acl_probe', 'SELECT') AS private_select,
         has_table_privilege('app_private', 'booking.__t005_default_acl_probe', 'INSERT') AS private_insert`,
    );
    assert.equal(bookingAcl.rows[0].private_select, true);
    assert.equal(bookingAcl.rows[0].private_insert, false);

    const recordsAcl = await client.query(
      `SELECT
         has_table_privilege('app_private', 'records.__t005_default_acl_probe', 'SELECT') AS can_select,
         has_table_privilege('app_private', 'records.__t005_default_acl_probe', 'INSERT') AS can_insert,
         has_table_privilege('app_private', 'records.__t005_default_acl_probe', 'UPDATE') AS can_update,
         has_table_privilege('app_private', 'records.__t005_default_acl_probe', 'DELETE') AS can_delete,
         has_sequence_privilege('app_private', 'records.__t005_default_acl_probe_id_seq', 'USAGE') AS sequence_usage`,
    );
    for (const privilege of Object.values(recordsAcl.rows[0])) {
      assert.equal(privilege, true);
    }

    const functionAcl = await client.query(
      `SELECT EXISTS (
         SELECT 1
           FROM pg_catalog.pg_proc p,
                LATERAL pg_catalog.aclexplode(
                  COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
                ) acl
          WHERE p.oid = 'booking.__t005_default_acl_probe_fn()'::regprocedure
            AND acl.grantee = 0
            AND acl.privilege_type = 'EXECUTE'
       ) AS public_can_execute`,
    );
    assert.equal(functionAcl.rows[0].public_can_execute, false);
    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
});
