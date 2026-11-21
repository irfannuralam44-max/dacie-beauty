-- Migrasi 0004: constraint dan pencegahan tabrakan booking ganda.

-- Exclusion constraint: dua booking aktif (pending/confirmed) untuk provider yang
-- sama tidak boleh memiliki interval waktu yang tumpang tindih.
-- Interval terpakai adalah [starts_at, starts_at + durasi + jeda) yang direpresentasikan
-- oleh rentang [starts_at, ends_at) dengan batas atas eksklusif, sehingga booking yang
-- berdekatan (seluruhnya menabrak) tidak dianggap bentrok.
ALTER TABLE booking.bookings
    ADD CONSTRAINT bookings_no_overlap_active
    EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    )
    WHERE (status IN ('pending', 'confirmed'));

-- Fungsi pemicu yang menjamin paling banyak dua akun users aktif secara bersamaan.
CREATE OR REPLACE FUNCTION records.enforce_max_two_active_users()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    active_count integer;
BEGIN
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
