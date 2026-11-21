-- Migrasi 0002: tabel inti skema booking.

CREATE TABLE booking.treatments (
    id bigserial PRIMARY KEY,
    nama text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    durasi_menit integer NOT NULL,
    jeda_menit integer NOT NULL DEFAULT 0
);

CREATE TABLE booking.providers (
    id bigserial PRIMARY KEY,
    nama_internal text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    priority integer NOT NULL DEFAULT 0
);

CREATE TABLE booking.working_hours (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES booking.providers(id) ON DELETE CASCADE,
    hari smallint NOT NULL CHECK (hari BETWEEN 1 AND 7),
    mulai time NOT NULL,
    selesai time NOT NULL,
    CHECK (mulai < selesai)
);

CREATE TABLE booking.time_off (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES booking.providers(id) ON DELETE CASCADE,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    keterangan text,
    is_active boolean NOT NULL DEFAULT true,
    CHECK (starts_at < ends_at)
);

-- Satu baris konfigurasi aturan booking. Nilai awal sesuai PRD (D-06).
CREATE TABLE booking.booking_rules (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    slot_step_minutes integer NOT NULL DEFAULT 30,
    min_notice_hours integer NOT NULL DEFAULT 3,
    max_advance_days integer NOT NULL DEFAULT 30,
    max_active_per_wa integer NOT NULL DEFAULT 2,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO booking.booking_rules (slot_step_minutes, min_notice_hours, max_advance_days, max_active_per_wa)
VALUES (30, 3, 30, 2);

CREATE TABLE booking.bookings (
    id bigserial PRIMARY KEY,
    nama text NOT NULL,
    nomor_wa text NOT NULL CHECK (nomor_wa ~ '^62[0-9]{9,13}$'),
    treatment_id bigint NOT NULL REFERENCES booking.treatments(id),
    provider_id bigint NOT NULL REFERENCES booking.providers(id),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (starts_at < ends_at)
);

CREATE TABLE booking.status_events (
    id bigserial PRIMARY KEY,
    booking_id bigint NOT NULL REFERENCES booking.bookings(id) ON DELETE CASCADE,
    from_status text,
    to_status text NOT NULL,
    actor_user_id integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pendukung kueri booking dan audit transisi status.
CREATE INDEX idx_bookings_provider_status ON booking.bookings (provider_id, status);
CREATE INDEX idx_bookings_starts_at ON booking.bookings (starts_at);
CREATE INDEX idx_status_events_booking ON booking.status_events (booking_id);
CREATE INDEX idx_working_hours_provider_hari ON booking.working_hours (provider_id, hari);
CREATE INDEX idx_time_off_provider ON booking.time_off (provider_id);
