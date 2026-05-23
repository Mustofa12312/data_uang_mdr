// ============================================================
// src/routes/ProtectedRoute.jsx
// ============================================================
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()

  // Tampilkan loading spinner hanya saat proses cek sesi awal
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  // Tidak ada user → ke login
  if (!user) return <Navigate to="/login" replace />

  // Route khusus admin: cek role dari profile
  // Jika profile belum dimuat tapi user ada, tunggu sebentar (profile bisa null sejenak)
  if (adminOnly) {
    if (profile === null) {
      // Profile masih dimuat, tampilkan loading singkat
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    if (profile?.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
