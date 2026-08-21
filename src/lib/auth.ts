/**
 * auth.ts — Autenticação via Supabase Auth
 * Médicos e responsáveis usam clientes Supabase separados para que as
 * sessões não colidam no localStorage do navegador.
 */
import { supabase, parentSupabase } from './supabase/client';
import { AuthSession, ParentSession } from '../types/ppueri';

export const DEMO_DOCTOR_EMAIL = 'demo@ppueri.com.br';
export const DEMO_DOCTOR_PASSWORD = 'ppueri2026';

// ─── Doctor Auth ──────────────────────────────────────────────────────────────

export async function registerDoctor(
  name: string,
  email: string,
  crm: string,
  password: string
): Promise<{ account: { id: string; name: string; email: string; crm: string } } | { error: string }> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };
  if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, email: email.toLowerCase().trim(), role: 'doctor', name: name.trim(), crm: crm.trim() });

  if (profileError) return { error: profileError.message };

  return { account: { id: data.user.id, name: name.trim(), email: email.toLowerCase().trim(), crm: crm.trim() } };
}

export async function loginDoctor(email: string, password: string): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, crm, role')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.role !== 'doctor') {
    await supabase.auth.signOut();
    return null;
  }

  return {
    doctorId: data.user.id,
    doctorName: profile.name as string,
    doctorCrm: (profile.crm as string) ?? '',
    email: data.user.email ?? email,
    expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
  };
}

/**
 * Carrega a sessão do médico a partir do Supabase (gerenciado internamente).
 * Retorna null se não há sessão válida ou o perfil não é de médico.
 */
export async function loadAuthSession(): Promise<AuthSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, crm, role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'doctor') return null;

  return {
    doctorId: session.user.id,
    doctorName: profile.name as string,
    doctorCrm: (profile.crm as string) ?? '',
    email: session.user.email ?? '',
    expiresAt: new Date(session.expires_at! * 1000).toISOString(),
  };
}

export async function clearAuthSession(): Promise<void> {
  await supabase.auth.signOut();
}

export function isSessionValid(session: AuthSession): boolean {
  return new Date(session.expiresAt) > new Date();
}

// ─── Parent Auth ──────────────────────────────────────────────────────────────

export async function registerParent(
  name: string,
  email: string,
  password: string,
  accessCode: string
): Promise<{ session: ParentSession } | { error: string }> {
  // 1. Busca o paciente pelo código de acesso via RPC pública
  const { data: found, error: rpcError } = await supabase.rpc('find_patient_by_access_code', {
    p_code: accessCode.trim().toUpperCase(),
  });

  if (rpcError || !found || found.length === 0) {
    return { error: 'Código de acesso não localizado. Verifique o código fornecido pelo pediatra.' };
  }

  const patientId: string = found[0].patient_id;
  const patientName: string = found[0].patient_name;

  // 2. Cria conta no Supabase Auth (cliente separado para o responsável)
  const { data, error } = await parentSupabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

  // 3. Cria o perfil do responsável
  const { error: profileError } = await parentSupabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: email.toLowerCase().trim(),
      role: 'parent',
      name: name.trim(),
      linked_patient_id: patientId,
    });

  if (profileError) return { error: profileError.message };

  const expiresAt = data.session
    ? new Date(data.session.expires_at! * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    session: {
      parentId: data.user.id,
      parentName: name.trim(),
      linkedPatientId: patientId,
      linkedPatientName: patientName,
      expiresAt,
    },
  };
}

export async function loginParent(email: string, password: string): Promise<ParentSession | null> {
  const { data, error } = await parentSupabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) return null;

  const { data: profile } = await parentSupabase
    .from('profiles')
    .select('name, role, linked_patient_id')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.role !== 'parent') {
    await parentSupabase.auth.signOut();
    return null;
  }

  // Busca o nome do paciente vinculado
  let patientName = '';
  if (profile.linked_patient_id) {
    const { data: patient } = await parentSupabase
      .from('patients')
      .select('name')
      .eq('id', profile.linked_patient_id)
      .single();
    patientName = (patient?.name as string) ?? '';
  }

  return {
    parentId: data.user.id,
    parentName: profile.name as string,
    linkedPatientId: (profile.linked_patient_id as string) ?? '',
    linkedPatientName: patientName,
    expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
  };
}

export async function loadParentSession(): Promise<ParentSession | null> {
  const { data: { session } } = await parentSupabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await parentSupabase
    .from('profiles')
    .select('name, role, linked_patient_id')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'parent') return null;

  let patientName = '';
  if (profile.linked_patient_id) {
    const { data: patient } = await parentSupabase
      .from('patients')
      .select('name')
      .eq('id', profile.linked_patient_id)
      .single();
    patientName = (patient?.name as string) ?? '';
  }

  return {
    parentId: session.user.id,
    parentName: profile.name as string,
    linkedPatientId: (profile.linked_patient_id as string) ?? '',
    linkedPatientName: patientName,
    expiresAt: new Date(session.expires_at! * 1000).toISOString(),
  };
}

export async function clearParentSession(): Promise<void> {
  await parentSupabase.auth.signOut();
}

export function isParentSessionValid(session: ParentSession): boolean {
  return new Date(session.expiresAt) > new Date();
}

// Mantido para compatibilidade — não faz nada pois o Supabase gerencia a sessão
export async function saveAuthSession(_session: AuthSession): Promise<void> { /* no-op */ }
export async function saveParentSession(_session: ParentSession): Promise<void> { /* no-op */ }
