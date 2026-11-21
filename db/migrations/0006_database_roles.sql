-- Migrasi 0006: role runtime, function owner, privilege minimum, dan default privileges.
-- Jalankan migrasi sebagai role migrasi tepercaya (bukan role runtime).

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'app_public') THEN
    CREATE ROLE app_public LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'app_private') THEN
    CREATE ROLE app_private LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'booking_public_fn_owner') THEN
    CREATE ROLE booking_public_fn_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'booking_private_fn_owner') THEN
    CREATE ROLE booking_private_fn_owner NOLOGIN;
  END IF;
END
$roles$;

-- Tegaskan atribut keamanan, termasuk bila role sudah dibuat sebelumnya.
ALTER ROLE app_public WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE app_private WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE booking_public_fn_owner WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE booking_private_fn_owner WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- Hilangkan seluruh membership yang menyentuh empat role ini, baik sebagai
-- member (hak diwariskan/SET ROLE) maupun sebagai role yang diberikan kepada
-- role lain. CASCADE juga mencabut membership turunan yang bergantung padanya.
DO $memberships$
DECLARE
  membership RECORD;
BEGIN
  FOR membership IN
    SELECT granted.rolname AS granted_role, member.rolname AS member_role
      FROM pg_catalog.pg_auth_members AS m
      JOIN pg_catalog.pg_roles AS granted ON granted.oid = m.roleid
      JOIN pg_catalog.pg_roles AS member ON member.oid = m.member
     WHERE granted.rolname IN (
       'app_public', 'app_private',
       'booking_public_fn_owner', 'booking_private_fn_owner'
     )
        OR member.rolname IN (
       'app_public', 'app_private',
       'booking_public_fn_owner', 'booking_private_fn_owner'
     )
  LOOP
    EXECUTE format(
      'REVOKE %I FROM %I CASCADE',
      membership.granted_role,
      membership.member_role
    );
  END LOOP;
END
$memberships$;

-- Tidak ada role aplikasi/owner yang boleh membuat objek atau memakai schema records
-- kecuali app_private. Cabut privilege bawaan yang mungkin berasal dari konfigurasi lama.
REVOKE ALL ON SCHEMA booking, records FROM PUBLIC;
REVOKE ALL ON SCHEMA booking, records FROM app_public, app_private,
  booking_public_fn_owner, booking_private_fn_owner;

GRANT USAGE ON SCHEMA booking TO app_public, booking_public_fn_owner, booking_private_fn_owner;
GRANT USAGE ON SCHEMA booking, records TO app_private;

-- Bersihkan privilege objek yang mungkin sudah ada, lalu berikan grant eksplisit.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA booking FROM PUBLIC, app_public, app_private,
  booking_public_fn_owner, booking_private_fn_owner;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA records FROM PUBLIC, app_public, app_private,
  booking_public_fn_owner, booking_private_fn_owner;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA booking FROM PUBLIC, app_public, app_private,
  booking_public_fn_owner, booking_private_fn_owner;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA records FROM PUBLIC, app_public, app_private,
  booking_public_fn_owner, booking_private_fn_owner;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA booking, records FROM PUBLIC, app_public,
  app_private, booking_public_fn_owner, booking_private_fn_owner;

-- app_private: baca semua data booking; kelola konfigurasi tanpa DELETE; tidak mengubah bookings.
GRANT SELECT ON ALL TABLES IN SCHEMA booking TO app_private;
GRANT INSERT, UPDATE ON TABLE
  booking.treatments,
  booking.providers,
  booking.working_hours,
  booking.time_off,
  booking.booking_rules
TO app_private;

-- app_private adalah satu-satunya role aplikasi dengan DML pada records.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA records TO app_private;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA records TO app_private;

-- Sequence hanya diberikan sesuai jalur INSERT yang diizinkan.
GRANT USAGE ON SEQUENCE
  booking.treatments_id_seq,
  booking.providers_id_seq,
  booking.working_hours_id_seq,
  booking.time_off_id_seq
TO app_private;
GRANT USAGE ON SEQUENCE booking.bookings_id_seq TO booking_public_fn_owner;
GRANT USAGE ON SEQUENCE booking.status_events_id_seq TO booking_private_fn_owner;

-- Owner fungsi publik: baca konfigurasi dan SELECT/INSERT bookings, tanpa UPDATE/DELETE.
GRANT SELECT ON TABLE
  booking.treatments,
  booking.providers,
  booking.working_hours,
  booking.time_off,
  booking.booking_rules,
  booking.bookings
TO booking_public_fn_owner;
GRANT INSERT ON TABLE booking.bookings TO booking_public_fn_owner;

-- Owner fungsi privat: hanya baca bookings, ubah kolom status, dan tulis event.
GRANT SELECT ON TABLE booking.bookings TO booking_private_fn_owner;
GRANT UPDATE (status) ON TABLE booking.bookings TO booking_private_fn_owner;
GRANT INSERT ON TABLE booking.status_events TO booking_private_fn_owner;

-- Default privileges untuk objek yang dibuat oleh role migrasi saat ini.
-- Schema booking: tabel baru hanya otomatis dapat dibaca app_private; DML konfigurasi
-- dan sequence baru harus diberi grant eksplisit sesuai tabel/jalur INSERT-nya.
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER
  REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER
  REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA booking
  GRANT SELECT ON TABLES TO app_private;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA records
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_private;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA records
  GRANT USAGE ON SEQUENCES TO app_private;

-- Fungsi trigger T-004 hanya dipanggil oleh trigger; jangan biarkan PUBLIC mengeksekusinya.
REVOKE ALL ON FUNCTION records.enforce_max_two_active_users() FROM PUBLIC,
  app_public, app_private, booking_public_fn_owner, booking_private_fn_owner;
