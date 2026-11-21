-- Migrasi 0001: inisialisasi skema booking dan records, tabel pelacakan migrasi,
-- serta extension btree_gist yang diperlukan exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE SCHEMA IF NOT EXISTS booking;
CREATE SCHEMA IF NOT EXISTS records;

CREATE TABLE booking.schema_migrations (
    version text PRIMARY KEY,
    name text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);
