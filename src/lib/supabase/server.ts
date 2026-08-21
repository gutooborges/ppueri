/**
 * Supabase client para uso no servidor Express (Node.js).
 * Importado somente em server.ts ou nos arquivos em api/.
 * Usa variáveis de ambiente sem o prefixo VITE_ pois o servidor
 * não passa pelo bundle do Vite.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
