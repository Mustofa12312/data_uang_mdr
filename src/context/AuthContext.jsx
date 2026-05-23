// ============================================================
// src/context/AuthContext.jsx
// ============================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(false) // baru: flag jika fetch profile gagal
  const [loading, setLoading] = useState(true)
  // Gunakan ref untuk mencegah double-call dari React StrictMode
  const initialized = useRef(false)

  async function fetchProfile(userId) {
    setProfileError(false)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, instansi:instansi_id(id, nama_instansi, kode_instansi)')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Profile fetch warning:', error.message)
        setProfileError(true) // tandai gagal agar tidak spinner selamanya
        return
      }

      if (data?.role === 'blocked') {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        return
      }

      setProfile(data)
      setProfileError(false)
    } catch (err) {
      console.warn('Profile fetch error (non-critical):', err.message)
      setProfileError(true) // tandai gagal agar tidak spinner selamanya
    }
  }

  useEffect(() => {
    // Cegah double initialization dari React StrictMode
    if (initialized.current) return
    initialized.current = true

    let mounted = true

    // Ambil sesi — LANGSUNG release loading, profile dimuat di background
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return

      if (error) {
        console.error('getSession error:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)
        // KRITIS: release loading dulu agar UI langsung tampil
        // fetchProfile jalan di background (tidak di-await)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }

      // Loading selesai begitu kita tahu status auth — tidak perlu tunggu profile
      if (mounted) setLoading(false)
    })

    // Pantau perubahan auth (login/logout) SETELAH inisiasi awal
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // Abaikan event INITIAL_SESSION karena sudah ditangani getSession() di atas
      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id) // non-blocking
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setProfileError(false)
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
    // fetchProfile akan dipanggil otomatis oleh onAuthStateChange (SIGNED_IN)
    // Jangan await di sini agar tidak memblokir navigasi
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isViewer = profile?.role === 'viewer'
  const instansiId = profile?.instansi?.id || profile?.instansi_id

  return (
    <AuthContext.Provider value={{ user, profile, profileError, loading, login, logout, isSuperAdmin, isViewer, instansiId }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
