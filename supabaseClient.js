import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError = (!url || !anonKey)
  ? 'Faltam as variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY. Configure-as no painel do Vercel (Settings → Environment Variables) e faça um redeploy.'
  : null;

if (supabaseConfigError) {
  console.error(supabaseConfigError);
}

export const supabase = supabaseConfigError ? null : createClient(url, anonKey);
