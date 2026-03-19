'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/context/ThemeContext'

type Customer = {
  id: string
  full_name: string
  phone: string
  email: string
  address: string
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { theme } = useTheme()
  const d = theme === 'dark'

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('full_name')
    setCustomers(data ?? [])
    setLoading(false)
  }

  async function saveCustomer() {
    if (!name) return
    setSaving(true)
    await supabase.from('customers').insert({ full_name: name, phone, email, address })
    setName(''); setPhone(''); setEmail(''); setAddress('')
    setShowForm(false)
    await fetchCustomers()
    setSaving(false)
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
  })

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#111] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>Müşteriler</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            {showForm ? 'İptal' : '+ Yeni Müşteri'}
          </button>
        </div>

        {showForm && (
          <div className={`rounded-xl border p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad *" className={inputCls} />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className={inputCls} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" className={inputCls} />
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adres" className={inputCls} />
            <div className="sm:col-span-2">
              <button
                onClick={saveCustomer}
                disabled={saving || !name}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim, telefon, e-posta ara..."
          className={inputCls + ' mb-4'}
        />

        {loading ? (
          <p className={`text-sm ${d ? 'text-[#444]' : 'text-gray-400'}`}>Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-20 text-sm ${d ? 'text-[#444]' : 'text-gray-400'}`}>
            {search ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}
          </div>
        ) : (
          <>
            <div className={`hidden sm:block rounded-xl border overflow-hidden ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                    {['Ad Soyad', 'Telefon', 'E-posta', 'Adres', 'Kayıt'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 font-medium ${d ? 'text-[#444]' : 'text-gray-400'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}
                      className={`border-b last:border-0 cursor-pointer transition ${d ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50'}`}
                      onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                      <td className={`px-4 py-3 font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{c.full_name}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>{c.phone ?? '—'}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>{c.email ?? '—'}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>{c.address ?? '—'}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>
                        {new Date(c.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-2">
              {filtered.map(c => (
                <div key={c.id}
                  className={`rounded-xl border p-4 cursor-pointer active:scale-[0.99] transition ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                  <p className={`font-medium text-sm mb-1 ${d ? 'text-white' : 'text-gray-900'}`}>{c.full_name}</p>
                  <p className={`text-xs ${d ? 'text-[#666]' : 'text-gray-400'}`}>{c.phone ?? '—'}</p>
                  <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{c.email ?? '—'}</p>
                  {c.address && <p className={`text-xs mt-0.5 ${d ? 'text-[#555]' : 'text-gray-400'}`}>{c.address}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}