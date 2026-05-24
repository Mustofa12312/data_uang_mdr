// ============================================================
// src/lib/supabase.js
// Supabase client — isi dengan credentials Supabase kamu
// ============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Gunakan localStorage (default) agar session tidak hilang saat refresh
// sessionStorage terbukti menyebabkan masalah dengan Supabase v2 onAuthStateChange
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
})
