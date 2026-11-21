-- Migrasi 0003: tabel inti skema records (data kulit/kesehatan dan akun internal).

CREATE TABLE records.users (
    id bigserial PRIMARY KEY,
    nama text NOT NULL,
    identitas_login text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE records.customers (
    id bigserial PRIMARY KEY,
    nama text NOT NULL,
    nomor_wa text NOT NULL UNIQUE CHECK (nomor_wa ~ '^62[0-9]{9,13}$'),
    jenis_kulit text,
    keluhan_utama text,
    alergi_sensitivitas text,
    catatan text,
    consent_at timestamptz,
    consent_version text
);

CREATE TABLE records.visits (
    id bigserial PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES records.customers(id) ON DELETE CASCADE,
    tanggal date NOT NULL,
    treatment text NOT NULL,
    catatan_kondisi_kulit text,
    produk text,
    saran text,
    follow_up_on date,
    created_by bigint NOT NULL REFERENCES records.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE records.audit_logs (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES records.users(id),
    aksi text NOT NULL,
    objek text NOT NULL,
    waktu timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE records.sessions (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES records.users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz
);

CREATE TABLE records.consent_versions (
    id bigserial PRIMARY KEY,
    versi_teks text NOT NULL UNIQUE,
    isi_teks text NOT NULL,
    tanggal_berlaku date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pendukung kueri rekam kulit, kunjungan, sesi, dan audit.
CREATE INDEX idx_visits_customer ON records.visits (customer_id);
CREATE INDEX idx_visits_follow_up ON records.visits (follow_up_on);
CREATE INDEX idx_audit_logs_user ON records.audit_logs (user_id);
CREATE INDEX idx_audit_logs_waktu ON records.audit_logs (waktu);
CREATE INDEX idx_sessions_user ON records.sessions (user_id);
CREATE INDEX idx_sessions_token_hash ON records.sessions (token_hash);
