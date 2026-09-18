-- =============================================================================
-- Ppueri — Migration de Compliance CFM 1.821/07 + LGPD Pediátrico
-- Execute no Supabase SQL Editor após o schema principal (schema.sql)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Coluna de imutabilidade na tabela consultations
--    status: 'draft' (rascunho editável) | 'finalized' (prontuário finalizado)
-- -----------------------------------------------------------------------------
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'finalized')),
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 2. TABELA: consultation_amendments
--    Adendos/retificações clínicas — nunca alteram o texto original (CFM 1.821/07)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultation_amendments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id  UUID NOT NULL REFERENCES consultations(id)  ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES profiles(id)        ON DELETE CASCADE,
  doctor_name      TEXT NOT NULL,
  doctor_crm       TEXT NOT NULL,
  amendment_text   TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consultation_amendments ENABLE ROW LEVEL SECURITY;

-- Médico: inserir adendos apenas nas próprias consultas
CREATE POLICY "amendments_doctor_insert" ON consultation_amendments
  FOR INSERT WITH CHECK (
    auth.uid() = doctor_id
    AND EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_id
        AND c.doctor_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Médico: ler adendos das próprias consultas
CREATE POLICY "amendments_doctor_select" ON consultation_amendments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_id
        AND c.doctor_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- Responsável: ler adendos do paciente vinculado
CREATE POLICY "amendments_parent_select" ON consultation_amendments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c
      JOIN profiles pr ON pr.linked_patient_id = c.patient_id
      WHERE c.id = consultation_id
        AND pr.id = auth.uid()
        AND pr.role = 'parent'
    )
  );

-- -----------------------------------------------------------------------------
-- 3. TABELA: access_audit_logs
--    Trilha de auditoria de acessos ao prontuário (CFM 1.821/07)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
  action     TEXT NOT NULL,
  timestamp  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE access_audit_logs ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir seu próprio log
CREATE POLICY "audit_logs_insert_own" ON access_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Apenas médicos podem consultar os logs
CREATE POLICY "audit_logs_doctor_select" ON access_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
  );

-- -----------------------------------------------------------------------------
-- 4. TABELA: legal_consents
--    Registros de consentimento LGPD — responsável legal por menor de idade
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_consents (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
  consent_type   TEXT NOT NULL CHECK (consent_type IN ('tcle_pediatric', 'privacy_policy')),
  accepted_at    TIMESTAMPTZ DEFAULT NOW(),
  ip_address     TEXT,
  guardian_name  TEXT NOT NULL,
  guardian_cpf   TEXT NOT NULL,
  term_version   TEXT NOT NULL DEFAULT '1.0'
);

ALTER TABLE legal_consents ENABLE ROW LEVEL SECURITY;

-- Responsável: inserir e consultar os próprios consentimentos
CREATE POLICY "consents_insert_own" ON legal_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consents_select_own" ON legal_consents
  FOR SELECT USING (auth.uid() = user_id);

-- Médico: ler consentimentos dos pacientes sob seus cuidados
CREATE POLICY "consents_doctor_select" ON legal_consents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN patients pat ON pat.doctor_id = p.id
      WHERE p.id = auth.uid()
        AND p.role = 'doctor'
        AND pat.id = legal_consents.patient_id
    )
  );
