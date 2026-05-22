// ============================================================
// src/context/AuthContext.jsx
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, instansi:instansi_id(id, nama_instansi, kode_instansi)')
        .eq('id', userId)
        .single()
        
      if (error) throw error

      if (data?.role === 'blocked') {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
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
