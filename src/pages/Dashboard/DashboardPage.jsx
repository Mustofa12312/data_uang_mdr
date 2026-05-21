// ============================================================
// src/pages/Dashboard/DashboardPage.jsx
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import StatCard from '../../components/ui/StatCard'
import { formatRupiah, formatNumber } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, BULAN_HIJRIYAH_LABEL, getBulanLabel } from '../../utils/hijriyah'
import { transaksiService, instansiService } from '../../services/supabase.service'
import { useAuth } from '../../context/AuthContext'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold">{formatRupiah(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [transaksi, setTransaksi] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState(instansiId || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSuperAdmin) {
      instansiService.getAll().then(setInstansiList).catch(console.error)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    setLoading(true)
    const id = isSuperAdmin ? (selectedInstansi || null) : instansiId
    transaksiService.getAll({ instansiId: id })
      .then(setTransaksi)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedInstansi, instansiId, isSuperAdmin])

  // Summary stats
  const stats = useMemo(() => {
    const pem = transaksi.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + (t.nominal || 0), 0)
    const pen = transaksi.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + (t.nominal || 0), 0)
    return { pemasukan: pem, pengeluaran: pen, saldo: pem - pen }
  }, [transaksi])

  // Chart data per bulan Hijriyah
  const chartData = useMemo(() => {
    return BULAN_HIJRIYAH.map(bulan => {
      const data = transaksi.filter(t => t.bulan_hijriyah === bulan)
      const pem = data.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + (t.nominal || 0), 0)
      const pen = data.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + (t.nominal || 0), 0)
      return { name: getBulanLabel(bulan).substring(0, 8), pem, pen, count: data.length }
    }).filter(d => d.pem > 0 || d.pen > 0)
  }, [transaksi])

  // Recent transactions
  const recent = useMemo(() =>
    [...transaksi].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [transaksi]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Ringkasan Keuangan</h2>
          <p className="text-sm text-slate-500">Data seluruh transaksi tercatat</p>
        </div>
        {isSuperAdmin && (
          <select
            className="input w-full sm:w-48"
            value={selectedInstansi}
            onChange={e => setSelectedInstansi(e.target.value)}
          >
            <option value="">Semua Instansi</option>
            {instansiList.map(i => (
              <option key={i.id} value={i.id}>{i.nama_instansi}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(n => (
            <div key={n} className="card p-5 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={ArrowTrendingUpIcon}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            label="Total Pemasukan"
            value={formatRupiah(stats.pemasukan)}
            sub={`${transaksi.filter(t=>t.jenis==='pemasukan').length} transaksi`}
          />
          <StatCard
            icon={ArrowTrendingDownIcon}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            label="Total Pengeluaran"
            value={formatRupiah(stats.pengeluaran)}
            sub={`${transaksi.filter(t=>t.jenis==='pengeluaran').length} transaksi`}
          />
          <StatCard
            icon={ScaleIcon}
            iconBg={stats.saldo >= 0 ? 'bg-blue-50' : 'bg-amber-50'}
            iconColor={stats.saldo >= 0 ? 'text-blue-600' : 'text-amber-600'}
            label="Saldo Akhir"
            value={formatRupiah(stats.saldo)}
            sub="Pemasukan – Pengeluaran"
          />
        </div>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 font-display mb-4">Grafik Per Bulan Hijriyah</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}jt` : v >= 1e3 ? `${(v/1e3).toFixed(0)}rb` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pem" name="Pemasukan" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="pen" name="Pengeluaran" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bulan summary table */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 font-display">Rekap Per Bulan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th className="text-right">Penerimaan</th>
                  <th className="text-right">Pengeluaran</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {BULAN_HIJRIYAH.map(bulan => {
                  const rows = transaksi.filter(t => t.bulan_hijriyah === bulan)
                  const pem = rows.filter(t => t.jenis === 'pemasukan').reduce((s,t) => s + t.nominal, 0)
                  const pen = rows.filter(t => t.jenis === 'pengeluaran').reduce((s,t) => s + t.nominal, 0)
                  if (pem === 0 && pen === 0) return null
                  return (
                    <tr key={bulan}>
                      <td className="font-medium">{getBulanLabel(bulan)}</td>
                      <td className="text-right text-emerald-600 text-money">{formatRupiah(pem)}</td>
                      <td className="text-right text-red-500 text-money">{formatRupiah(pen)}</td>
                      <td className={`text-right text-money font-semibold ${pem-pen>=0?'text-blue-600':'text-amber-600'}`}>{formatRupiah(pem-pen)}</td>
                    </tr>
                  )
                })}
                {transaksi.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Belum ada data transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 font-display">Transaksi Terbaru</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm">Belum ada transaksi</p>
            )}
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.jenis==='pemasukan' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {t.jenis === 'pemasukan'
                    ? <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" />
                    : <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.uraian || '-'}</p>
                  <p className="text-xs text-slate-400">{t.tanggal || ''} · {getBulanLabel(t.bulan_hijriyah)}</p>
                </div>
                <span className={`text-sm font-semibold text-money flex-shrink-0 ${t.jenis==='pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.jenis === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
