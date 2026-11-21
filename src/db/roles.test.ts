import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
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

async function listObjects(client: Client, kind: 'tables' | 'sequences', schema: string) {
  const result = kind === 'tables'
    ? await client.query(
        `SELECT table_name AS object_name
           FROM information_schema.tables
          WHERE table_schema = $1 AND table_type = 'BASE TABLE'
          ORDER BY table_name`,
        [schema],
      )
    : await client.query(
        `SELECT sequence_name AS object_name
           FROM information_schema.sequences
          WHERE sequence_schema = $1
          ORDER BY sequence_name`,
        [schema],
      );
  return result.rows.map((row: { object_name: string }) => row.object_name as string);
}

async function privilege(client: Client, relation: string, name: string) {
  try {
    const result = await client.query(
      'SELECT has_table_privilege(current_user, $1, $2) AS allowed',
      [relation, name],
    );
    return result.rows[0].allowed as boolean;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '42501'
    ) {
      return false;
    }
    throw error;
  }
}

test('app_public dengan kredensial nyata ditolak SELECT dan INSERT pada setiap tabel/sequence', async (t) => {
  if (!skipIfMissing(t, ADMIN_URL, 'DATABASE_URL') ||
      !skipIfMissing(t, PUBLIC_URL, 'APP_PUBLIC_DATABASE_URL')) return;

  const admin = await connect(ADMIN_URL as string);
  const publicClient = await connect(PUBLIC_URL as string);
  try {
    for (const schema of ['booking', 'records']) {
      for (const table of await listObjects(admin, 'tables', schema)) {
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
      for (const sequence of await listObjects(admin, 'sequences', schema)) {
        let sequenceUsage = false;
        try {
          const result = await publicClient.query(
            'SELECT has_sequence_privilege(current_user, $1, \'USAGE\') AS allowed',
            [`"${schema}"."${sequence}"`],
          );
          sequenceUsage = result.rows[0].allowed as boolean;
        } catch (error: unknown) {
          if (
            typeof error !== 'object' ||
            error === null ||
            !('code' in error) ||
            (error as { code?: string }).code !== '42501'
          ) {
            throw error;
          }
        }
        assert.equal(sequenceUsage, false, `app_public tidak boleh memakai ${schema}.${sequence}`);
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
    const bookingTables = await listObjects(client, 'tables', 'booking');
    for (const table of bookingTables) {
      await client.query(`SELECT * FROM booking."${table}" LIMIT 0`);
    }

    for (const table of ['treatments', 'providers', 'working_hours', 'time_off', 'booking_rules']) {
      assert.equal(await privilege(client, `booking.${table}`, 'INSERT'), true, `${table}: INSERT`);
      assert.equal(await privilege(client, `booking.${table}`, 'UPDATE'), true, `${table}: UPDATE`);
      assert.equal(await privilege(client, `booking.${table}`, 'DELETE'), false, `${table}: DELETE`);
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

    for (const table of await listObjects(client, 'tables', 'records')) {
      for (const action of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        assert.equal(await privilege(client, `records.${table}`, action), true,
          `app_private harus memiliki ${action} pada records.${table}`);
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

    const bookingTables = await listObjects(client, 'tables', 'booking');
    const recordsTables = await listObjects(client, 'tables', 'records');
    const bookingSequences = await listObjects(client, 'sequences', 'booking');

    await client.query('SET ROLE booking_public_fn_owner');
    assert.equal((await client.query(
      "SELECT has_schema_privilege(current_user, 'booking', 'USAGE') AS allowed",
    )).rows[0].allowed, true);
    assert.equal((await client.query(
      "SELECT has_schema_privilege(current_user, 'records', 'USAGE') AS allowed",
    )).rows[0].allowed, false);

    const publicSelect = new Set([
      'treatments', 'providers', 'working_hours', 'time_off', 'booking_rules', 'bookings',
    ]);
    for (const table of bookingTables) {
      const relation = `booking.${table}`;
      assert.equal(await privilege(client, relation, 'SELECT'), publicSelect.has(table), `${relation} SELECT`);
      assert.equal(await privilege(client, relation, 'INSERT'), table === 'bookings', `${relation} INSERT`);
      assert.equal(await privilege(client, relation, 'UPDATE'), false, `${relation} UPDATE`);
      assert.equal(await privilege(client, relation, 'DELETE'), false, `${relation} DELETE`);
    }
    for (const table of recordsTables) {
      for (const action of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        assert.equal(await privilege(client, `records.${table}`, action), false,
          `booking_public_fn_owner ${action} records.${table}`);
      }
    }
    for (const sequence of bookingSequences) {
      const result = await client.query(
        'SELECT has_sequence_privilege(current_user, $1, \'USAGE\') AS allowed',
        [`booking.${sequence}`],
      );
      assert.equal(result.rows[0].allowed, sequence === 'bookings_id_seq');
    }
    await client.query('RESET ROLE');

    await client.query('SET ROLE booking_private_fn_owner');
    assert.equal((await client.query(
      "SELECT has_schema_privilege(current_user, 'booking', 'USAGE') AS allowed",
    )).rows[0].allowed, true);
    assert.equal((await client.query(
      "SELECT has_schema_privilege(current_user, 'records', 'USAGE') AS allowed",
    )).rows[0].allowed, false);

    for (const table of bookingTables) {
      const relation = `booking.${table}`;
      assert.equal(await privilege(client, relation, 'SELECT'), table === 'bookings', `${relation} SELECT`);
      assert.equal(await privilege(client, relation, 'INSERT'), table === 'status_events', `${relation} INSERT`);
      assert.equal(await privilege(client, relation, 'UPDATE'), false, `${relation} table UPDATE`);
      assert.equal(await privilege(client, relation, 'DELETE'), false, `${relation} DELETE`);
    }

    const columns = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'booking' AND table_name = 'bookings'`,
    );
    for (const { column_name } of columns.rows) {
      const result = await client.query(
        'SELECT has_column_privilege(current_user, $1, $2, \'UPDATE\') AS allowed',
        ['booking.bookings', column_name],
      );
      assert.equal(result.rows[0].allowed, column_name === 'status', `UPDATE kolom bookings.${column_name}`);
    }
    for (const table of recordsTables) {
      for (const action of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        assert.equal(await privilege(client, `records.${table}`, action), false,
          `booking_private_fn_owner ${action} records.${table}`);
      }
    }
    for (const sequence of bookingSequences) {
      const result = await client.query(
        'SELECT has_sequence_privilege(current_user, $1, \'USAGE\') AS allowed',
        [`booking.${sequence}`],
      );
      assert.equal(result.rows[0].allowed, sequence === 'status_events_id_seq');
    }
    await client.query('RESET ROLE');
  } finally {
    await client.query('RESET ROLE').catch(() => {});
    await client.end();
  }
});

test('migrasi membersihkan membership tambahan dan aman untuk role yang sudah ada', async (t) => {
  if (!skipIfMissing(t, ADMIN_URL, 'DATABASE_URL')) return;
  const client = await connect(ADMIN_URL as string);
  const targetRoles = [
    'app_public',
    'app_private',
    'booking_public_fn_owner',
    'booking_private_fn_owner',
  ];
  try {
    await client.query('BEGIN');
    await client.query('CREATE ROLE t005_membership_probe NOLOGIN');

    // Buat membership dua arah pada seluruh role. app_public mewarisi hak
    // app_private sehingga tes membuktikan privilege efektif memang bertambah.
    for (const role of targetRoles) {
      await client.query(`GRANT t005_membership_probe TO "${role}"`);
      await client.query(`GRANT "${role}" TO t005_membership_probe`);
    }
    await client.query('GRANT app_private TO app_public');

    const leakedBefore = await client.query(
      "SELECT has_table_privilege('app_public', 'records.users', 'SELECT') AS allowed",
    );
    assert.equal(leakedBefore.rows[0].allowed, true,
      'membership app_private seharusnya menambahkan privilege efektif sebelum migrasi');

    // Simulasikan role lama dengan atribut yang terlalu permisif.
    await client.query('ALTER ROLE app_public CREATEDB CREATEROLE BYPASSRLS');
    await client.query('ALTER ROLE app_private CREATEDB CREATEROLE BYPASSRLS');
    await client.query('ALTER ROLE booking_public_fn_owner LOGIN CREATEDB CREATEROLE BYPASSRLS');
    await client.query('ALTER ROLE booking_private_fn_owner LOGIN CREATEDB CREATEROLE BYPASSRLS');

    const migrationSql = await readFile(
      new URL('../../db/migrations/0006_database_roles.sql', import.meta.url),
      'utf8',
    );
    await client.query(migrationSql);

    const memberships = await client.query(
      `SELECT granted.rolname AS granted_role, member.rolname AS member_role
         FROM pg_catalog.pg_auth_members AS m
         JOIN pg_catalog.pg_roles AS granted ON granted.oid = m.roleid
         JOIN pg_catalog.pg_roles AS member ON member.oid = m.member
        WHERE granted.rolname = ANY($1::text[])
           OR member.rolname = ANY($1::text[])`,
      [targetRoles],
    );
    assert.deepEqual(memberships.rows, [], 'tidak boleh ada membership yang menyentuh role T-005');

    const effective = await client.query(
      `SELECT
         has_table_privilege('app_public', 'records.users', 'SELECT') AS public_records_select,
         has_table_privilege('app_private', 'booking.bookings', 'INSERT') AS private_booking_insert`,
    );
    assert.equal(effective.rows[0].public_records_select, false,
      'app_public tidak boleh memperoleh SELECT records melalui membership');
    assert.equal(effective.rows[0].private_booking_insert, false,
      'app_private tidak boleh memperoleh INSERT bookings melalui membership');

    const roles = await client.query(
      `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
         FROM pg_catalog.pg_roles
        WHERE rolname = ANY($1::text[])
        ORDER BY rolname`,
      [targetRoles],
    );
    assert.equal(roles.rows.length, 4);
    for (const role of roles.rows) {
      assert.equal(role.rolsuper, false);
      assert.equal(role.rolcreatedb, false);
      assert.equal(role.rolcreaterole, false);
      assert.equal(role.rolreplication, false);
      assert.equal(role.rolbypassrls, false);
      assert.equal(
        role.rolcanlogin,
        role.rolname === 'app_public' || role.rolname === 'app_private',
        `${role.rolname}: atribut LOGIN`,
      );
    }
  } finally {
    await client.query('ROLLBACK').catch(() => {});
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
    for (const privilegeValue of Object.values(recordsAcl.rows[0])) {
      assert.equal(privilegeValue, true);
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
