import { DoctorAccount, AuthSession } from '../types/ppueri';

export const DEMO_DOCTOR_ID = 'doctor_demo';
export const DEMO_DOCTOR_EMAIL = 'demo@ppueri.com.br';
export const DEMO_DOCTOR_PASSWORD = 'ppueri2026';

const AUTH_KEYS = {
  DOCTOR_ACCOUNTS: 'ppueri_doctor_accounts_v1',
  AUTH_SESSION: 'ppueri_auth_session_v1',
};

// SHA-256 hash via Web Crypto API (browser-native, no deps required)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ppueri_secure_salt_2026_lgpd');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

export function loadDoctorAccounts(): DoctorAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.DOCTOR_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as DoctorAccount[];
    }
  } catch (err) {
    console.warn('[Ppueri Auth] Erro ao carregar contas:', err);
  }
  return [];
}

export function saveDoctorAccounts(accounts: DoctorAccount[]): void {
  try {
    localStorage.setItem(AUTH_KEYS.DOCTOR_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('[Ppueri Auth] Erro ao salvar contas:', err);
  }
}

export function getDoctorByEmail(email: string): DoctorAccount | null {
  const accounts = loadDoctorAccounts();
  return accounts.find((a) => a.email.toLowerCase() === email.toLowerCase().trim()) ?? null;
}

export async function registerDoctor(
  name: string,
  email: string,
  crm: string,
  password: string
): Promise<{ account: DoctorAccount } | { error: string }> {
  const existing = getDoctorByEmail(email);
  if (existing) return { error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' };

  const passwordHash = await hashPassword(password);
  const newAccount: DoctorAccount = {
    id: `doctor_${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    crm: crm.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const accounts = loadDoctorAccounts();
  accounts.push(newAccount);
  saveDoctorAccounts(accounts);
  return { account: newAccount };
}

export async function loginDoctor(
  email: string,
  password: string
): Promise<AuthSession | null> {
  const account = getDoctorByEmail(email);
  if (!account) return null;

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    doctorId: account.id,
    doctorName: account.name,
    doctorCrm: account.crm,
    email: account.email,
    expiresAt: expiresAt.toISOString(),
  };
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.AUTH_SESSION);
    if (raw) return JSON.parse(raw) as AuthSession;
  } catch (err) {
    console.warn('[Ppueri Auth] Erro ao carregar sessão:', err);
  }
  return null;
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_KEYS.AUTH_SESSION, JSON.stringify(session));
  } catch (err) {
    console.error('[Ppueri Auth] Erro ao salvar sessão:', err);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_KEYS.AUTH_SESSION);
  } catch (err) {
    console.error('[Ppueri Auth] Erro ao limpar sessão:', err);
  }
}

export function isSessionValid(session: AuthSession): boolean {
  return new Date(session.expiresAt) > new Date();
}

// Creates the demo "Dra. Beatriz" account if no accounts exist yet
export async function initializeDemoAccount(): Promise<void> {
  const accounts = loadDoctorAccounts();
  if (accounts.some((a) => a.id === DEMO_DOCTOR_ID)) return;

  const passwordHash = await hashPassword(DEMO_DOCTOR_PASSWORD);
  const demoAccount: DoctorAccount = {
    id: DEMO_DOCTOR_ID,
    name: 'Dra. Beatriz Albuquerque',
    email: DEMO_DOCTOR_EMAIL,
    crm: 'CRM/SP 184.920 - Pediatria SBP',
    passwordHash,
    createdAt: '2026-01-01T00:00:00Z',
  };
  accounts.push(demoAccount);
  saveDoctorAccounts(accounts);
}
