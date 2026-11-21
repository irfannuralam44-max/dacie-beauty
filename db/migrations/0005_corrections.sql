-- Migrasi 0005: koreksi tipe actor_user_id dan serialisasi pemicu batas dua akun aktif.

-- actor_user_id konsisten dengan records.users.id (bigint), tanpa foreign key lintas schema.
ALTER TABLE booking.status_events
    ALTER COLUMN actor_user_id TYPE bigint;

-- Pemicu batas maksimal dua akun aktif diperbaiki agar aman terhadap transaksi bersamaan.
-- pg_advisory_xact_lock memastikan hanya satu transaksi pada satu waktu yang menjalankan
-- pemeriksaan jumlah akun aktif, sehingga dua transaksi bersamaan tidak sama-sama lolos.
DROP TRIGGER IF EXISTS trg_users_max_two_active ON records.users;

CREATE OR REPLACE FUNCTION records.enforce_max_two_active_users()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    active_count integer;
BEGIN
    PERFORM pg_advisory_xact_lock(202611210004);
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active') THEN
        SELECT COUNT(*) INTO active_count
        FROM records.users
        WHERE status = 'active'
          AND id <> COALESCE(NEW.id, OLD.id);
        IF active_count >= 2 THEN
            RAISE EXCEPTION 'Maksimal dua akun aktif diperbolehkan';
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_users_max_two_active
BEFORE INSERT OR UPDATE OF status ON records.users
FOR EACH ROW
EXECUTE FUNCTION records.enforce_max_two_active_users();
