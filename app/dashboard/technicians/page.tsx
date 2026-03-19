'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'

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
  const { theme } = useTheme()
  const d = theme === 'dark'

  useEffect(() => { fetchTechnicians() }, [])

  async function fetchTechnicians() {
    const { data } = await supabase.from('technicians').select('*').order('full_name')
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

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#111] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>Teknisyenler</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            {showForm ? 'İptal' : '+ Yeni Teknisyen'}
          </button>
        </div>

        {showForm && (
          <div className={`rounded-xl border p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
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
          <p className={`text-sm ${d ? 'text-[#444]' : 'text-gray-400'}`}>Yükleniyor...</p>
        ) : (
          <div className={`rounded-xl border overflow-hidden ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                  {['Ad Soyad', 'Telefon', 'E-posta', 'Durum', ''].map(h => (
                    <th key={h} className={`text-left px-4 py-3 font-medium ${d ? 'text-[#444]' : 'text-gray-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {technicians.map(t => (
                  <tr key={t.id} className={`border-b last:border-0 ${d ? 'border-white/[0.04]' : 'border-gray-50'}`}>
                    <td className={`px-4 py-3 font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{t.full_name}</td>
                    <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>{t.phone ?? '—'}</td>
                    <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>{t.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        t.is_active
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {t.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(t.id, t.is_active)}
                        className={`text-xs transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
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