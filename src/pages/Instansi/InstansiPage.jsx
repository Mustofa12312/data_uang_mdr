// ============================================================
// src/pages/Instansi/InstansiPage.jsx
// Super admin only
// ============================================================
import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { instansiService } from '../../services/supabase.service'

const EMPTY = { nama_instansi: '', kode_instansi: '', alamat: '', aktif: true }

export default function InstansiPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try { setList(await instansiService.getAll()) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openAdd() { setForm(EMPTY); setEditItem(null); setModalOpen(true) }
  function openEdit(item) { setForm({ nama_instansi: item.nama_instansi, kode_instansi: item.kode_instansi, alamat: item.alamat || '', aktif: item.aktif }); setEditItem(item); setModalOpen(true) }

  async function handleSave() {
    if (!form.nama_instansi || !form.kode_instansi) return
    setSaving(true)
    try {
      if (editItem) await instansiService.update(editItem.id, form)
      else await instansiService.create(form)
      setModalOpen(false); load()
    } catch(e) { alert('Gagal: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleToggle(item) {
    try { await instansiService.toggle(item.id, !item.aktif); load() }
    catch(e) { alert(e.message) }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-slate-800 font-display">Manajemen Instansi</h2>
          <p className="text-sm text-slate-500">{list.length} instansi terdaftar</p>
        </div>
        <button id="btn-tambah-instansi" className="btn-primary" onClick={openAdd}>
          <PlusIcon className="w-4 h-4" /> Tambah Instansi
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Memuat...</div>
          ) : list.length === 0 ? (
            <EmptyState title="Belum ada instansi" action={<button className="btn-primary btn-sm" onClick={openAdd}>+ Tambah Instansi</button>} />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Instansi</th>
                  <th>Kode</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, i) => (
                  <tr key={item.id}>
                    <td className="text-slate-400">{i+1}</td>
                    <td className="font-medium">{item.nama_instansi}</td>
                    <td><span className="badge-slate">{item.kode_instansi}</span></td>
                    <td className="text-slate-500">{item.alamat || '-'}</td>
                    <td>
                      <span className={item.aktif ? 'badge-green' : 'badge-red'}>
                        {item.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition" title="Edit">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggle(item)} className={`p-1.5 rounded transition ${item.aktif ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`} title={item.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                          {item.aktif ? <XCircleIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Instansi' : 'Tambah Instansi'}
        footer={<><button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Instansi *</label>
            <input className="input" placeholder="Nama unit/instansi" value={form.nama_instansi} onChange={e => setForm(f => ({...f, nama_instansi: e.target.value}))} />
          </div>
          <div>
            <label className="label">Kode Instansi *</label>
            <input className="input" placeholder="mis: MTQ, MTS, KOPERASI" value={form.kode_instansi} onChange={e => setForm(f => ({...f, kode_instansi: e.target.value.toUpperCase()}))} />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input className="input" placeholder="Alamat instansi" value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
