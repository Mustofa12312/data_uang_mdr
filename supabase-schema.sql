-- ============================================================
-- SIKAP DARUR ROHMAN — Supabase SQL Schema
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabel instansi
CREATE TABLE IF NOT EXISTS instansi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_instansi VARCHAR NOT NULL,
  kode_instansi VARCHAR UNIQUE NOT NULL,
  alamat        TEXT,
  aktif         BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel profiles (extend auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama         VARCHAR NOT NULL,
  email        VARCHAR,
  role         VARCHAR CHECK (role IN ('super_admin', 'admin_instansi', 'viewer')) DEFAULT 'admin_instansi',
  instansi_id  UUID REFERENCES instansi(id) ON DELETE SET NULL,
  akses_menu   JSONB DEFAULT '["/dashboard", "/transaksi", "/buku-kas", "/laporan"]'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel transaksi
CREATE TABLE IF NOT EXISTS transaksi (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instansi_id      UUID REFERENCES instansi(id) ON DELETE CASCADE,
  tanggal          DATE,
  tanggal_hijriyah VARCHAR,
  bulan_hijriyah   VARCHAR,
  tahun_hijriyah   VARCHAR DEFAULT '1446',
  kode_transaksi   VARCHAR,
  nomor_bukti      VARCHAR,
  uraian           TEXT NOT NULL,
  sumber_dana      VARCHAR,
  jenis            VARCHAR CHECK (jenis IN ('pemasukan', 'pengeluaran')) NOT NULL,
  nominal          BIGINT NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE instansi   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi  ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get current user instansi_id
CREATE OR REPLACE FUNCTION get_user_instansi()
RETURNS UUID AS $$
  SELECT instansi_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ---- RLS: instansi ----
-- Super admin bisa semua, user lain hanya baca instansi mereka
CREATE POLICY "instansi_select" ON instansi FOR SELECT
  USING (get_user_role() = 'super_admin' OR id = get_user_instansi());

CREATE POLICY "instansi_all_superadmin" ON instansi FOR ALL
  USING (get_user_role() = 'super_admin');

-- ---- RLS: profiles ----
CREATE POLICY "profiles_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'super_admin');

CREATE POLICY "profiles_update_superadmin" ON profiles FOR ALL
  USING (get_user_role() = 'super_admin');

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ---- RLS: transaksi ----
-- Super admin: semua; admin_instansi: instansi sendiri; viewer: read only instansi sendiri
CREATE POLICY "transaksi_select" ON transaksi FOR SELECT
  USING (
    get_user_role() = 'super_admin'
    OR instansi_id = get_user_instansi()
  );

CREATE POLICY "transaksi_insert" ON transaksi FOR INSERT
  WITH CHECK (
    get_user_role() IN ('super_admin', 'admin_instansi')
    AND (get_user_role() = 'super_admin' OR instansi_id = get_user_instansi())
  );

CREATE POLICY "transaksi_update" ON transaksi FOR UPDATE
  USING (
    get_user_role() IN ('super_admin', 'admin_instansi')
    AND (get_user_role() = 'super_admin' OR instansi_id = get_user_instansi())
  );

CREATE POLICY "transaksi_delete" ON transaksi FOR DELETE
  USING (
    get_user_role() IN ('super_admin', 'admin_instansi')
    AND (get_user_role() = 'super_admin' OR instansi_id = get_user_instansi())
  );

-- ============================================================
-- Trigger: auto-create profile saat user baru register
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nama, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), NEW.email, 'admin_instansi')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Seed data: 7 Instansi dari Excel BKU
-- ============================================================
INSERT INTO instansi (nama_instansi, kode_instansi, alamat, aktif) VALUES
  ('Yayasan / DRC',       'DRC',         'Blu''uran, Karang Penang, Sampang', true),
  ('MI Ibtidaiyah',       'IBTIDAIYAH',  'Blu''uran, Karang Penang, Sampang', true),
  ('Koperasi',            'KOPERASI',    'Blu''uran, Karang Penang, Sampang', true),
  ('Madrasah Ibtidaiyah', 'MI',          'Blu''uran, Karang Penang, Sampang', true),
  ('MTQ',                 'MTQ',         'Blu''uran, Karang Penang, Sampang', true),
  ('MTs',                 'MTS',         'Blu''uran, Karang Penang, Sampang', true),
  ('Ma''hadiyah',         'MAHADIYAH',   'Blu''uran, Karang Penang, Sampang', true)
ON CONFLICT (kode_instansi) DO NOTHING;
