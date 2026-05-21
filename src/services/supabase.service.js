// ============================================================
// src/services/supabase.service.js — Generic Supabase helpers
// ============================================================
import { supabase } from '../lib/supabase'

// ---- INSTANSI ----
export const instansiService = {
  async getAll() {
    const { data, error } = await supabase
      .from('instansi')
      .select('*')
      .order('nama_instansi')
    if (error) throw error
    return data
  },
  async getById(id) {
    const { data, error } = await supabase
      .from('instansi').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },
  async create(payload) {
    const { data, error } = await supabase.from('instansi').insert(payload).select().single()
    if (error) throw error
    return data
  },
  async update(id, payload) {
    const { data, error } = await supabase.from('instansi').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async toggle(id, aktif) {
    const { data, error } = await supabase.from('instansi').update({ aktif }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ---- TRANSAKSI ----
export const transaksiService = {
  async getAll({ instansiId, bulanHijriyah, tahunHijriyah, search, tglMulai, tglAkhir, limit = 1000 }) {
    let q = supabase
      .from('transaksi')
      .select('*, instansi:instansi_id(nama_instansi, kode_instansi)')
      .order('tanggal', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (instansiId) q = q.eq('instansi_id', instansiId)
    if (bulanHijriyah) q = q.eq('bulan_hijriyah', bulanHijriyah)
    if (tahunHijriyah) q = q.eq('tahun_hijriyah', tahunHijriyah)
    if (search) q = q.ilike('uraian', `%${search}%`)
    if (tglMulai) q = q.gte('tanggal', tglMulai)
    if (tglAkhir) q = q.lte('tanggal', tglAkhir)

    const { data, error } = await q
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase.from('transaksi').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('transaksi').update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('transaksi').delete().eq('id', id)
    if (error) throw error
  },

  async getSummary(instansiId, tahunHijriyah) {
    let q = supabase.from('transaksi').select('jenis, nominal, bulan_hijriyah')
    if (instansiId) q = q.eq('instansi_id', instansiId)
    if (tahunHijriyah) q = q.eq('tahun_hijriyah', tahunHijriyah)
    const { data, error } = await q
    if (error) throw error
    return data
  },
}

// ---- PROFILES ----
export const profileService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, instansi:instansi_id(nama_instansi)')
      .order('nama')
    if (error) throw error
    return data
  },
  async create(authUser, payload) {
    const { data, error } = await supabase.from('profiles').insert({ id: authUser.id, ...payload }).select().single()
    if (error) throw error
    return data
  },
  async update(id, payload) {
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

// ---- PENGATURAN ----
export const pengaturanService = {
  async getSettings() {
    const { data, error } = await supabase.from('pengaturan').select('*').eq('id', 1).single()
    if (error && error.code !== 'PGRST116') throw error // Abaikan error jika data kosong (belum ada baris)
    return data || {}
  },
  async updateSettings(payload) {
    const { data, error } = await supabase
      .from('pengaturan')
      .update(payload)
      .eq('id', 1)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
