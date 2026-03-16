'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

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

  const inputCls = "w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-medium">Müşteriler</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            {showForm ? 'İptal' : '+ Yeni Müşteri'}
          </button>
        </div>

        {/* Yeni müşteri formu */}
        {showForm && (
          <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Arama */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim veya telefon ara..."
          className={inputCls + ' mb-4'}
        />

        {loading ? (
          <p className="text-[#444] text-sm">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#444] text-sm">
            {search ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}
          </div>
        ) : (
          <>
            {/* Masaüstü tablo */}
            <div className="hidden sm:block bg-[#1a1a1a] rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Ad Soyad</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Telefon</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">E-posta</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Adres</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Kayıt</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                      <td className="px-4 py-3 text-white font-medium">{c.full_name}</td>
                      <td className="px-4 py-3 text-[#888]">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-[#888]">{c.email ?? '—'}</td>
                      <td className="px-4 py-3 text-[#888]">{c.address ?? '—'}</td>
                      <td className="px-4 py-3 text-[#444]">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobil liste */}
            <div className="sm:hidden space-y-2">
              {filtered.map(c => (
                <div key={c.id} className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4 cursor-pointer active:scale-[0.99] transition" onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                  <p className="text-white font-medium text-sm mb-1">{c.full_name}</p>
                  <p className="text-[#666] text-xs">{c.phone ?? '—'}</p>
                  <p className="text-[#555] text-xs">{c.email ?? '—'}</p>
                  {c.address && <p className="text-[#555] text-xs mt-0.5">{c.address}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}