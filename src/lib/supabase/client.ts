/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Ppueri] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env');
}

/** Client principal — sessão do médico */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // necessário para capturar o token do link de reset de senha
    storageKey: 'ppueri_doctor_supabase_auth_v1',
  },
});

/**
 * Client separado para sessão do responsável (pai/mãe).
 * Usa uma chave de armazenamento diferente para que as sessões
 * do médico e do responsável não colidam no mesmo navegador.
 */
export const parentSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,  // o client do médico é quem lida com tokens na URL
    storageKey: 'ppueri_parent_supabase_auth_v1',
  },
});
