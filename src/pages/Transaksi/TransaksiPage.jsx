// ============================================================
// src/pages/Transaksi/TransaksiPage.jsx
// CRUD Transaksi dengan tabel kolom BKU sesuai format Excel asli
// ============================================================
import { useState, useEffect, useMemo, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { formatRupiah } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, getBulanLabel } from '../../utils/hijriyah'
import { transaksiService, instansiService, pengaturanService } from '../../services/supabase.service'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  tanggal: '',
  tanggal_hijriyah: '',
  bulan_hijriyah: 'SYAWAL',
  tahun_hijriyah: '1446',
  kode_transaksi: '',
  nomor_bukti: '',
  uraian: '',
  sumber_dana: '',
  jenis: 'pemasukan',
  nominal: '',
  instansi_id: '',
}

export default function TransaksiPage() {
  const { isSuperAdmin, isViewer, instansiId, user } = useAuth()
  const [rows, setRows] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
  const [filterTahun, setFilterTahun] = useState('1446')
  const [filterInstansi, setFilterInstansi] = useState(instansiId || '')

  useEffect(() => {
    if (isSuperAdmin) instansiService.getAll().then(setInstansiList).catch(console.error)
    
    pengaturanService.getSettings().then(s => {
      if (s?.tahun_aktif) setFilterTahun(s.tahun_aktif)
    }).catch(console.error)
  }, [isSuperAdmin])

  async function load() {
    setLoading(true)
    const id = isSuperAdmin ? (filterInstansi || null) : instansiId
    try {
      const data = await transaksiService.getAll({
        instansiId: id,
        bulanHijriyah: filterBulan || null,
        tahunHijriyah: filterTahun || null,
        search: search || null,
      })
      // hitung saldo berjalan
      let saldo = 0
      const withSaldo = data.map(t => {
        if (t.jenis === 'pemasukan') saldo += t.nominal
        else saldo -= t.nominal
        return { ...t, saldo_berjalan: saldo }
      })
      setRows(withSaldo)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterBulan, filterTahun, filterInstansi, instansiId, isSuperAdmin])

  function handleSearch(e) {
    e.preventDefault()
    load()
  }

  function openAdd() {
    setForm({ 
      ...EMPTY_FORM, 
      instansi_id: isSuperAdmin ? (filterInstansi || '') : instansiId,
      tahun_hijriyah: filterTahun
    })
    setEditRow(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setForm({
      tanggal: row.tanggal || '',
      tanggal_hijriyah: row.tanggal_hijriyah || '',
      bulan_hijriyah: row.bulan_hijriyah || 'SYAWAL',
      tahun_hijriyah: row.tahun_hijriyah || '1446',
      kode_transaksi: row.kode_transaksi || '',
      nomor_bukti: row.nomor_bukti || '',
      uraian: row.uraian || '',
      sumber_dana: row.sumber_dana || '',
      jenis: row.jenis || 'pemasukan',
      nominal: String(row.nominal || ''),
      instansi_id: row.instansi_id || '',
    })
    setEditRow(row)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.uraian || !form.nominal) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        nominal: parseInt(form.nominal) || 0,
        instansi_id: isSuperAdmin ? form.instansi_id : instansiId,
        created_by: user?.id,
      }
      if (editRow) await transaksiService.update(editRow.id, payload)
      else await transaksiService.create(payload)
      setModalOpen(false)
      load()
    } catch(e) { alert('Gagal menyimpan: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await transaksiService.delete(deleteId)
      setDeleteId(null)
      load()
    } catch(e) { alert('Gagal hapus: ' + e.message) }
  }

  const summary = useMemo(() => {
    const pem = rows.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0)
    const pen = rows.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0)
    return { pem, pen, saldo: pem - pen }
  }, [rows])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Cari uraian transaksi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Cari</button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <select className="input w-auto" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}>
            <option value="">Semua Bulan</option>
            {BULAN_HIJRIYAH.map(b => <option key={b} value={b}>{getBulanLabel(b)}</option>)}
          </select>
          <input
            type="text"
            className="input w-24"
            placeholder="Tahun H"
            value={filterTahun}
            onChange={e => setFilterTahun(e.target.value)}
            title="Filter Tahun Hijriyah"
          />
          {isSuperAdmin && (
            <select className="input w-auto" value={filterInstansi} onChange={e => setFilterInstansi(e.target.value)}>
              <option value="">Semua Instansi</option>
              {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
            </select>
          )}
          {!isViewer && (
            <button id="btn-tambah-transaksi" className="btn-primary" onClick={openAdd}>
              <PlusIcon className="w-4 h-4" /> Tambah
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Penerimaan', value: summary.pem, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pengeluaran', value: summary.pen, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Saldo', value: summary.saldo, color: summary.saldo >= 0 ? 'text-blue-600' : 'text-amber-600', bg: summary.saldo >= 0 ? 'bg-blue-50' : 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-3 text-center ${bg}`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-sm font-bold text-money mt-0.5 ${color}`}>{formatRupiah(value)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Klik 'Tambah' untuk mencatat transaksi pertama."
              action={!isViewer && <button className="btn-primary btn-sm" onClick={openAdd}>+ Tambah Transaksi</button>}
            />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-8">No</th>
                  <th>Tgl Masehi</th>
                  <th>Tgl Hijriyah</th>
                  <th>No. Kode</th>
                  <th>No. Bukti</th>
                  <th>Uraian</th>
                  <th>Sumber Dana</th>
                  <th className="text-right">Penerimaan</th>
                  <th className="text-right">Pengeluaran</th>
                  <th className="text-right">Saldo</th>
                  {!isViewer && <th className="w-20">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td className="whitespace-nowrap">{row.tanggal || '-'}</td>
                    <td className="whitespace-nowrap text-slate-500">{row.tanggal_hijriyah || '-'}</td>
                    <td className="text-slate-500">{row.kode_transaksi || '-'}</td>
                    <td className="text-slate-500">{row.nomor_bukti || '-'}</td>
                    <td className="max-w-xs">
                      <p className="truncate font-medium">{row.uraian}</p>
                      {row.instansi && <p className="text-[10px] text-slate-400">{row.instansi.nama_instansi}</p>}
                    </td>
                    <td className="text-slate-500 whitespace-nowrap">{row.sumber_dana || '-'}</td>
                    <td className="text-right text-money text-emerald-600">
                      {row.jenis === 'pemasukan' ? formatRupiah(row.nominal) : '-'}
                    </td>
                    <td className="text-right text-money text-red-500">
                      {row.jenis === 'pengeluaran' ? formatRupiah(row.nominal) : '-'}
                    </td>
                    <td className={`text-right text-money font-semibold ${row.saldo_berjalan >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                      {formatRupiah(row.saldo_berjalan)}
                    </td>
                    {!isViewer && (
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(row.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"
                            title="Hapus"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Footer totals */}
                <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <td colSpan={7} className="text-right text-slate-600 pr-4">JUMLAH</td>
                  <td className="text-right text-money text-emerald-700">{formatRupiah(summary.pem)}</td>
                  <td className="text-right text-money text-red-600">{formatRupiah(summary.pen)}</td>
                  <td className={`text-right text-money ${summary.saldo >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{formatRupiah(summary.saldo)}</td>
                  {!isViewer && <td />}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Transaksi' : 'Tambah Transaksi'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : (editRow ? 'Simpan Perubahan' : 'Simpan Transaksi')}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {isSuperAdmin && (
            <div className="col-span-2">
              <label className="label">Instansi</label>
              <select className="input" value={form.instansi_id} onChange={e => setForm(f => ({...f, instansi_id: e.target.value}))}>
                <option value="">-- Pilih Instansi --</option>
                {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Jenis Transaksi</label>
            <select className="input" value={form.jenis} onChange={e => setForm(f => ({...f, jenis: e.target.value}))}>
              <option value="pemasukan">Penerimaan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="label">Nominal (Rp)</label>
            <input type="number" className="input" placeholder="0" min="0"
              value={form.nominal} onChange={e => setForm(f => ({...f, nominal: e.target.value}))} />
          </div>
          <div>
            <label className="label">Tanggal Masehi</label>
            <input type="date" className="input" value={form.tanggal}
              onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} />
          </div>
          <div>
            <label className="label">Tanggal Hijriyah</label>
            <input type="text" className="input" placeholder="mis: 1 Syawal 1446"
              value={form.tanggal_hijriyah} onChange={e => setForm(f => ({...f, tanggal_hijriyah: e.target.value}))} />
          </div>
          <div>
            <label className="label">Bulan Hijriyah</label>
            <select className="input" value={form.bulan_hijriyah} onChange={e => setForm(f => ({...f, bulan_hijriyah: e.target.value}))}>
              {BULAN_HIJRIYAH.map(b => <option key={b} value={b}>{getBulanLabel(b)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tahun Hijriyah</label>
            <input type="text" className="input" placeholder="1446"
              value={form.tahun_hijriyah} onChange={e => setForm(f => ({...f, tahun_hijriyah: e.target.value}))} />
          </div>
          <div>
            <label className="label">No. Kode</label>
            <input type="text" className="input" placeholder="Kode transaksi"
              value={form.kode_transaksi} onChange={e => setForm(f => ({...f, kode_transaksi: e.target.value}))} />
          </div>
          <div>
            <label className="label">No. Bukti</label>
            <input type="text" className="input" placeholder="No. kwitansi/bukti"
              value={form.nomor_bukti} onChange={e => setForm(f => ({...f, nomor_bukti: e.target.value}))} />
          </div>
          <div className="col-span-2">
            <label className="label">Uraian *</label>
            <input type="text" className="input" placeholder="Keterangan transaksi..."
              value={form.uraian} onChange={e => setForm(f => ({...f, uraian: e.target.value}))} required />
          </div>
          <div className="col-span-2">
            <label className="label">Sumber Dana</label>
            <input type="text" className="input" placeholder="Asal sumber dana"
              value={form.sumber_dana} onChange={e => setForm(f => ({...f, sumber_dana: e.target.value}))} />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Transaksi"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Batal</button>
            <button className="btn-danger" onClick={handleDelete}>Ya, Hapus</button>
          </>
        }
      >
        <p className="text-slate-600 text-sm">Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  )
}
