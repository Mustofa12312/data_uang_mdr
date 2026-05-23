// ============================================================
// src/lib/supabase.js
// Supabase client — isi dengan credentials Supabase kamu
// ============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kpjvngkgtpetnksfzdfh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanZuZ2tndHBldG5rc2Z6ZGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzQxOTQsImV4cCI6MjA5NDkxMDE5NH0.mS9FQPect6r7pirJnx78Um74LI8QoaD8unKG_3TzpUA'

// Gunakan localStorage (default) agar session tidak hilang saat refresh
// sessionStorage terbukti menyebabkan masalah dengan Supabase v2 onAuthStateChange
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
})
