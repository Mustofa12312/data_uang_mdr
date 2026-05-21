import { useState, useEffect } from 'react'
import { Cog6ToothIcon, ArrowDownTrayIcon, DocumentCheckIcon } from '@heroicons/react/24/outline'
import { pengaturanService, transaksiService } from '../../services/supabase.service'
import * as XLSX from 'xlsx'
import { formatRupiah } from '../../utils/formatRupiah'
import { getBulanLabel } from '../../utils/hijriyah'

export default function SettingsPage() {
  const [form, setForm] = useState({
    nama_yayasan: '',
    alamat_yayasan: '',
    ketua_yayasan: '',
    bendahara_pusat: '',
    tahun_aktif: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadSettings() {
    setLoading(true)
    try {
      const data = await pengaturanService.getSettings()
      if (data && data.id) {
        setForm({
          nama_yayasan: data.nama_yayasan || '',
          alamat_yayasan: data.alamat_yayasan || '',
          ketua_yayasan: data.ketua_yayasan || '',
          bendahara_pusat: data.bendahara_pusat || '',
          tahun_aktif: data.tahun_aktif || ''
        })
      }
    } catch (e) {
      console.error(e)
      showToast('Gagal memuat pengaturan. Pastikan Anda sudah menjalankan SQL tabel pengaturan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await pengaturanService.updateSettings(form)
      showToast('Pengaturan berhasil disimpan! Tampilan cetak laporan akan menggunakan data baru ini.')
    } catch (e) {
      console.error(e)
      showToast('Gagal menyimpan pengaturan.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleBackup() {
    setExporting(true)
    try {
      // Ambil seluruh data transaksi tanpa batasan instansi/bulan (limit besar)
      const data = await transaksiService.getAll({ limit: 100000 })
      
      if (data.length === 0) {
        showToast('Tidak ada transaksi untuk di-backup.', 'error')
        return
      }

      // Format data untuk Excel
      const wsData = [
        ['BACKUP MASTER DATA TRANSAKSI SIKAP'],
        ['Tanggal Backup', ':', new Date().toLocaleString()],
        [],
        ['No', 'Instansi', 'Tanggal (M)', 'Tanggal (H)', 'Bulan (H)', 'Tahun (H)', 'Kode', 'Bukti', 'Jenis', 'Uraian', 'Sumber Dana', 'Nominal (Rp)', 'Dibuat Pada']
      ]

      data.forEach((t, i) => {
        wsData.push([
          i + 1,
          t.instansi?.nama_instansi || '-',
          t.tanggal || '',
          t.tanggal_hijriyah || '',
          getBulanLabel(t.bulan_hijriyah) || t.bulan_hijriyah || '',
          t.tahun_hijriyah || '',
          t.kode_transaksi || '',
          t.nomor_bukti || '',
          t.jenis?.toUpperCase() || '',
          t.uraian || '',
          t.sumber_dana || '',
          t.nominal || 0,
          new Date(t.created_at).toLocaleString()
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Master Data")
      
      const fileName = `Backup_Master_SIKAP_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      showToast(`Berhasil mengekspor ${data.length} transaksi!`)
    } catch (e) {
      console.error(e)
      showToast('Gagal melakukan backup data.', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Memuat pengaturan...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div>
        <h2 className="font-bold text-slate-800 font-display text-2xl flex items-center gap-2">
          <Cog6ToothIcon className="w-6 h-6 text-emerald-600" />
          Pengaturan Sistem
        </h2>
        <p className="text-sm text-slate-500 mt-1">Kelola identitas yayasan, tanda tangan laporan, dan backup data master.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Pengaturan */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="card p-6 space-y-5">
            <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <DocumentCheckIcon className="w-5 h-5 text-emerald-500" />
              Identitas & Kop Laporan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Nama Induk Yayasan</label>
                <input required className="input" placeholder="Contoh: Pondok Pesantren Darur Rohman"
                  value={form.nama_yayasan} onChange={e => setForm({ ...form, nama_yayasan: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Akan muncul di baris paling atas kop surat BKU.</p>
              </div>

              <div className="md:col-span-2">
                <label className="label">Alamat Lengkap (Kop Surat)</label>
                <input required className="input" placeholder="Contoh: Blu'uran, Karang Penang, Sampang"
                  value={form.alamat_yayasan} onChange={e => setForm({ ...form, alamat_yayasan: e.target.value })} />
              </div>

              <div>
                <label className="label">Nama Ketua Yayasan</label>
                <input required className="input" placeholder="Nama Ketua"
                  value={form.ketua_yayasan} onChange={e => setForm({ ...form, ketua_yayasan: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Penandatangan kiri pada cetak BKU.</p>
              </div>

              <div>
                <label className="label">Nama Bendahara Pusat</label>
                <input required className="input" placeholder="Nama Bendahara"
                  value={form.bendahara_pusat} onChange={e => setForm({ ...form, bendahara_pusat: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Penandatangan kanan pada cetak BKU.</p>
              </div>
            </div>

            <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3 pt-4">Preferensi Sistem</h3>
            <div className="w-full md:w-1/2">
              <label className="label">Tahun Pembukuan Aktif (Hijriyah)</label>
              <input required type="text" className="input font-mono" placeholder="1446"
                value={form.tahun_aktif} onChange={e => setForm({ ...form, tahun_aktif: e.target.value })} />
              <p className="text-[10px] text-slate-400 mt-1">Tahun ini akan otomatis terpilih di menu Laporan & BKU.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Backup Data */}
        <div className="space-y-6">
          <div className="card p-6 border-amber-200 bg-amber-50">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 border border-amber-200">
              <ArrowDownTrayIcon className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-amber-900 mb-2">Backup Master Data</h3>
            <p className="text-xs text-amber-700 leading-relaxed mb-6">
              Fitur ini akan mengekspor <strong>seluruh data transaksi dari semua instansi dan bulan</strong> ke dalam satu file Excel (.xlsx). 
              Sangat disarankan untuk melakukan backup setiap akhir bulan sebagai arsip darurat pimpinan.
            </p>
            <button 
              onClick={handleBackup} 
              disabled={exporting}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {exporting ? 'Memproses Data...' : 'Download Master Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
