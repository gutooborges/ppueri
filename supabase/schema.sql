-- =============================================================================
-- Ppueri — Esquema PostgreSQL completo com RLS
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABELA: profiles
-- Estende auth.users com dados do médico ou responsável
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('doctor', 'parent')),
  name          TEXT NOT NULL,
  crm           TEXT,                       -- somente médicos
  linked_patient_id UUID,                   -- somente responsáveis
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- TABELA: patients
-- =============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  birth_date             DATE NOT NULL,
  gender                 TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino')),
  mother_name            TEXT NOT NULL,
  father_name            TEXT,
  cpf                    TEXT,
  sus_number             TEXT,
  access_code            TEXT UNIQUE NOT NULL,
  access_code_created_at TIMESTAMPTZ DEFAULT NOW(),
  blood_type             TEXT,
  allergies              TEXT[]       DEFAULT '{}',
  chronic_conditions     TEXT[]       DEFAULT '{}',
  photo_url              TEXT,
  created_at             TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Médico: acesso total aos seus pacientes
CREATE POLICY "patients_doctor_all" ON patients
  FOR ALL USING (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Responsável: leitura do paciente vinculado ao seu perfil
CREATE POLICY "patients_parent_select" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND linked_patient_id = patients.id
    )
  );

-- =============================================================================
-- TABELA: consultations
-- =============================================================================
CREATE TABLE IF NOT EXISTS consultations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id         UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_name        TEXT NOT NULL,
  doctor_crm         TEXT NOT NULL,
  date               TIMESTAMPTZ NOT NULL,
  anamnesis          JSONB NOT NULL DEFAULT '{}',
  antropometry       JSONB NOT NULL DEFAULT '{}',
  vitals             JSONB NOT NULL DEFAULT '{}',
  vitals_evaluations JSONB          DEFAULT '[]',
  exams              JSONB          DEFAULT '[]',
  vaccine_updates    JSONB          DEFAULT '[]',
  care_plan          JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ    DEFAULT NOW()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultations_doctor_all" ON consultations
  FOR ALL USING (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "consultations_parent_select" ON consultations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND linked_patient_id = consultations.patient_id
    )
  );

-- =============================================================================
-- TABELA: complementary_exams
-- Exames complementares (OCR, PDF) independentes ou vinculados a uma consulta
-- =============================================================================
CREATE TABLE IF NOT EXISTS complementary_exams (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consultation_id       UUID REFERENCES consultations(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL,
  exam_date             DATE NOT NULL,
  file_url              TEXT,
  file_name             TEXT,
  items                 JSONB   DEFAULT '[]',
  doctor_interpretation TEXT,
  is_ocr_parsed         BOOLEAN DEFAULT FALSE,
  is_abnormal           BOOLEAN DEFAULT FALSE,
  ai_summary            TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complementary_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exams_doctor_all" ON complementary_exams
  FOR ALL USING (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "exams_parent_select" ON complementary_exams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND linked_patient_id = complementary_exams.patient_id
    )
  );

-- =============================================================================
-- TABELA: vaccines
-- =============================================================================
CREATE TABLE IF NOT EXISTS vaccines (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id             UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vaccine_id             TEXT NOT NULL,
  vaccine_name           TEXT NOT NULL,
  target_disease         TEXT NOT NULL,
  target_age_bracket     TEXT NOT NULL,
  age_months_recommended INTEGER NOT NULL,
  dose_number            INTEGER NOT NULL,
  total_doses            INTEGER NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pendente'
                           CHECK (status IN ('aplicada','pendente','atrasada','proxima')),
  application_date       DATE,
  batch_number           TEXT,
  clinic_name            TEXT,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaccines_doctor_all" ON vaccines
  FOR ALL USING (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "vaccines_parent_select" ON vaccines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND linked_patient_id = vaccines.patient_id
    )
  );

-- =============================================================================
-- TABELA: appointments
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id           UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name         TEXT NOT NULL,
  mother_name          TEXT NOT NULL,
  doctor_name          TEXT NOT NULL,
  doctor_crm           TEXT NOT NULL,
  date                 DATE NOT NULL,
  time                 TIME NOT NULL,
  duration_minutes     INTEGER,
  type                 TEXT NOT NULL
                         CHECK (type IN ('rotina','retorno','urgencia','desenvolvimento')),
  status               TEXT NOT NULL DEFAULT 'agendada'
                         CHECK (status IN ('agendada','concluida','cancelada')),
  notes                TEXT,
  preparation_checklist JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_doctor_all" ON appointments
  FOR ALL USING (
    auth.uid() = doctor_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "appointments_parent_select" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND linked_patient_id = appointments.patient_id
    )
  );

-- =============================================================================
-- FUNÇÃO: find_patient_by_access_code
-- Permite que responsáveis não autenticados busquem o paciente pelo código
-- de acesso durante o cadastro (SECURITY DEFINER ignora RLS).
-- =============================================================================
CREATE OR REPLACE FUNCTION find_patient_by_access_code(p_code TEXT)
RETURNS TABLE (patient_id UUID, patient_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT id, name
  FROM patients
  WHERE UPPER(access_code) = UPPER(TRIM(p_code));
END;
$$;

-- Conceder execução a usuários não autenticados (anon)
GRANT EXECUTE ON FUNCTION find_patient_by_access_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION find_patient_by_access_code(TEXT) TO authenticated;

-- =============================================================================
-- SUPABASE STORAGE — bucket exam-files + políticas RLS
-- =============================================================================
-- 1. Crie o bucket no Dashboard: Storage → New Bucket
--    Nome: exam-files | Public: OFF (privado) | File size limit: 50 MB
--    Ou via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-files',
  'exam-files',
  false,
  52428800,  -- 50 MB
  ARRAY['application/pdf','image/jpeg','image/png','image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- 2. Políticas RLS do storage
-- Médicos: upload/download/delete de arquivos dos seus pacientes
CREATE POLICY "doctors_exam_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exam-files' AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN patients pat ON pat.doctor_id = p.id
      WHERE p.id = auth.uid() AND p.role = 'doctor'
        AND (storage.foldername(name))[1] = pat.id::text
    )
  );

CREATE POLICY "doctors_exam_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exam-files' AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN patients pat ON pat.doctor_id = p.id
      WHERE p.id = auth.uid() AND p.role = 'doctor'
        AND (storage.foldername(name))[1] = pat.id::text
    )
  );

CREATE POLICY "doctors_exam_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exam-files' AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN patients pat ON pat.doctor_id = p.id
      WHERE p.id = auth.uid() AND p.role = 'doctor'
        AND (storage.foldername(name))[1] = pat.id::text
    )
  );

-- Responsáveis (pais): somente download do arquivo do paciente vinculado
CREATE POLICY "parents_exam_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exam-files' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'parent'
        AND (storage.foldername(name))[1] = p.linked_patient_id::text
    )
  );

-- =============================================================================
-- CONTA DEMO (opcional)
-- Execute após criar o usuário demo@ppueri.com.br no Supabase Auth Dashboard
-- ou via Supabase CLI: supabase auth admin create-user
-- Substitua <DEMO_USER_UUID> pelo UUID gerado pelo Supabase Auth.
-- =============================================================================
-- INSERT INTO profiles (id, email, role, name, crm)
-- VALUES (
--   '<DEMO_USER_UUID>',
--   'demo@ppueri.com.br',
--   'doctor',
--   'Dra. Beatriz Albuquerque',
--   'CRM/SP 184.920 - Pediatria SBP'
-- ) ON CONFLICT (id) DO NOTHING;
