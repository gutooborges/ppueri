/**
 * auth.ts — Autenticação via Supabase Auth
 * Médicos e responsáveis usam clientes Supabase separados para que as
 * sessões não colidam no localStorage do navegador.
 */
import { supabase, parentSupabase } from './supabase/client';
import { AuthSession, ParentSession } from '../types/ppueri';

export const DEMO_DOCTOR_EMAIL = 'demo@ppueri.com.br';
export const DEMO_DOCTOR_PASSWORD = 'ppueri2026';

// ─── Error Translation ─────────────────────────────────────────────────────────

function translateSupabaseError(message: string): string {
  const msg = message.toLowerCase();
  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already registered')
  ) {
    return 'E-mail já cadastrado. Faça login ou use "Esqueceu a senha" para recuperar o acesso.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('signup is disabled') || msg.includes('signups not allowed')) {
    return 'Cadastro desativado. Entre em contato com o administrador do sistema.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Formato de e-mail inválido. Verifique e tente novamente.';
  }
  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('fetch failed')
  ) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  return message;
}

// ─── Doctor Auth ──────────────────────────────────────────────────────────────

/**
 * Cria conta do médico. Retorna:
 * - `{ session }` quando o Supabase não exige confirmação de e-mail (login automático)
 * - `{ needsConfirmation: true }` quando o e-mail precisa ser confirmado antes do login
 * - `{ error }` em caso de falha
 */
export async function registerDoctor(
  name: string,
  email: string,
  crm: string,
  password: string,
): Promise<{ session: AuthSession } | { needsConfirmation: true } | { error: string }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.trim(),
        role: 'doctor',
        crm: crm.trim(),
      },
    },
  });

  if (error) return { error: translateSupabaseError(error.message) };
  if (!data.user) return { error: 'Erro ao criar conta. Tente novamente.' };

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: email.toLowerCase().trim(),
      role: 'doctor',
      name: name.trim(),
      crm: crm.trim(),
    });

  if (profileError) return { error: translateSupabaseError(profileError.message) };

  // signUp retornou sessão → confirmação de e-mail desativada, login automático possível
  if (data.session) {
    return {
      session: {
        doctorId: data.user.id,
        doctorName: name.trim(),
        doctorCrm: crm.trim(),
        email: data.user.email ?? email,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      },
    };
  }

  // Conta criada, mas confirmação de e-mail necessária
  return { needsConfirmation: true };
}

/**
 * Autentica o médico. Lança um Error com mensagem em português se falhar.
 */
export async function loginDoctor(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(translateSupabaseError(error.message));
  if (!data.user || !data.session) {
    throw new Error('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, crm, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error(
      'Perfil médico não encontrado. Crie uma conta ou verifique suas credenciais.',
    );
  }

  if (profile.role !== 'doctor') {
    await supabase.auth.signOut();
    throw new Error(
      'Acesso restrito a médicos. Use o Portal do Responsável para acessar como familiar.',
    );
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
  accessCode: string,
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
  if (error) return { error: translateSupabaseError(error.message) };
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

  if (profileError) return { error: translateSupabaseError(profileError.message) };

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
