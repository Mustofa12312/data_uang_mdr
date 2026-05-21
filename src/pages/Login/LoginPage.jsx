// ============================================================
// src/pages/Login/LoginPage.jsx
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Email atau password salah. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheckIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl font-display">SIKAP</p>
              <p className="text-emerald-200 text-xs">Darur Rohman</p>
            </div>
          </div>
          <h2 className="text-white font-display font-bold text-4xl leading-tight mb-4">
            Sistem Informasi<br />Keuangan &amp;<br />Pelaporan
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed max-w-xs">
            Pengelolaan keuangan Pondok Pesantren Darur Rohman yang modern, terpusat, dan mudah digunakan.
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Instansi', value: '7+' },
              { label: 'Bulan Hijriyah', value: '12' },
              { label: 'Laporan', value: '∞' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-white text-2xl font-bold font-display">{value}</p>
                <p className="text-emerald-200 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-emerald-300 text-xs mt-6 text-center">
            Dibuat oleh Cakrawala Digital. <br />Hubungi : 0813 5908 8246
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 font-display">SIKAP</p>
              <p className="text-slate-400 text-xs">Darur Rohman</p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-800 font-display">Selamat Datang 👋</h1>
              <p className="text-slate-500 text-sm mt-1">Masuk untuk mengakses sistem keuangan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="nama@darurrohman.id"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className={`input pr-10 ${error ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                id="btn-login"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Memverifikasi...
                  </>
                ) : 'Masuk ke Sistem'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Hubungi administrator jika lupa password
          </p>
        </div>
      </div>
    </div>
  )
}
