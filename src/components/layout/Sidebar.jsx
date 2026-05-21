// ============================================================
// src/components/layout/Sidebar.jsx
// ============================================================
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon,
  BanknotesIcon,
  BookOpenIcon,
  DocumentChartBarIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: HomeIcon },
  { to: '/transaksi',  label: 'Transaksi',   icon: BanknotesIcon },
  { to: '/buku-kas',   label: 'Buku Kas Umum', icon: BookOpenIcon },
  { to: '/laporan',    label: 'Laporan',     icon: DocumentChartBarIcon },
]

const adminItems = [
  { to: '/instansi', label: 'Instansi', icon: BuildingOffice2Icon },
  { to: '/users',    label: 'Pengguna',  icon: UsersIcon },
]

export default function Sidebar({ open, onClose }) {
  const { profile, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const sidebarClass = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col
    transform transition-transform duration-200 ease-in-out
    ${open ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 lg:static lg:z-auto
  `

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClass}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 font-display leading-tight">SIKAP</p>
            <p className="text-[10px] text-slate-500 leading-tight">Darur Rohman</p>
          </div>
        </div>

        {/* Profile mini */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-emerald-700">
                {profile?.nama?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{profile?.nama || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{profile?.role?.replace('_', ' ') || '-'}</p>
            </div>
          </div>
          {profile?.instansi && (
            <div className="mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-[10px] text-emerald-700 font-medium truncate">
              {profile.instansi.nama_instansi}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu Utama</p>
          {navItems
            .filter(item => isSuperAdmin || !profile?.akses_menu || profile.akses_menu.includes(item.to))
            .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isSuperAdmin && (
            <>
              <p className="px-3 py-1.5 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Administrasi</p>
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon style={{ width: '18px', height: '18px' }} className="flex-shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <ArrowRightOnRectangleIcon style={{ width: '18px', height: '18px' }} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}
