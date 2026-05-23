// ============================================================
// src/context/AuthContext.jsx
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Gunakan ref untuk mencegah double-call dari React StrictMode
  const initialized = useRef(false)

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, instansi:instansi_id(id, nama_instansi, kode_instansi)')
        .eq('id', userId)
        .single()

      if (error) {
        // Jika profile tidak ketemu (404), biarkan user tetap login
        // Jangan auto-logout karena bisa jadi masalah jaringan sementara
        console.warn('Profile fetch warning:', error.message)
        return
      }

      if (data?.role === 'blocked') {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (err) {
      // Jangan auto-logout pada network error — user masih valid
      console.warn('Profile fetch error (non-critical):', err.message)
    }
  }

  useEffect(() => {
    // Cegah double initialization dari React StrictMode
    if (initialized.current) return
    initialized.current = true

    let mounted = true

    // Ambil sesi yang ada terlebih dahulu (sinkron dari localStorage)
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return

      if (error) {
        console.error('getSession error:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }

      if (mounted) setLoading(false)
    })

    // Pantau perubahan auth (login/logout) SETELAH inisiasi awal
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Abaikan event INITIAL_SESSION karena sudah ditangani getSession() di atas
      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Ambil profil setelah login berhasil
    if (data.user) await fetchProfile(data.user.id)
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isViewer = profile?.role === 'viewer'
  const instansiId = profile?.instansi?.id || profile?.instansi_id

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, isSuperAdmin, isViewer, instansiId }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
