'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Technician = {
  id: string
  full_name: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchTechnicians() }, [])

  async function fetchTechnicians() {
    const { data } = await supabase
      .from('technicians')
      .select('*')
      .order('full_name')
    setTechnicians(data ?? [])
    setLoading(false)
  }

  async function saveTechnician() {
    if (!name) return
    setSaving(true)
    await supabase.from('technicians').insert({ full_name: name, phone, email })
    setName(''); setPhone(''); setEmail('')
    setShowForm(false)
    await fetchTechnicians()
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('technicians').update({ is_active: !current }).eq('id', id)
    await fetchTechnicians()
  }

  const inputCls = "w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-medium">Teknisyenler</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            {showForm ? 'İptal' : '+ Yeni Teknisyen'}
          </button>
        </div>

        {showForm && (
          <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad *" className={inputCls} />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className={inputCls} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" className={inputCls} />
            <div className="sm:col-span-3">
              <button
                onClick={saveTechnician}
                disabled={saving || !name}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-[#444] text-sm">Yükleniyor...</p>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-[#444] font-medium">Ad Soyad</th>
                  <th className="text-left px-4 py-3 text-[#444] font-medium">Telefon</th>
                  <th className="text-left px-4 py-3 text-[#444] font-medium">E-posta</th>
                  <th className="text-left px-4 py-3 text-[#444] font-medium">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {technicians.map(t => (
                  <tr key={t.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3 text-white font-medium">{t.full_name}</td>
                    <td className="px-4 py-3 text-[#888]">{t.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-[#888]">{t.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        t.is_active
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {t.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(t.id, t.is_active)}
                        className="text-[#444] hover:text-white text-xs transition"
                      >
                        {t.is_active ? 'Pasife al' : 'Aktife al'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}