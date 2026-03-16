'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

type Customer = {
  id: string
  full_name: string
  phone: string
  email: string
  address: string
  created_at: string
}

type Device = {
  id: string
  brand: string
  model: string
  serial_number: string
  notes: string
}

type WorkOrder = {
  id: string
  order_number: number
  status: string
  problem_description: string
  created_at: string
  devices: { brand: string; model: string } | null
  technicians: { full_name: string } | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
  beklemede:       { label: 'Beklemede',       cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  incelemede:      { label: 'İncelemede',      cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  onay_bekleniyor: { label: 'Onay Bekleniyor', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  tamirde:         { label: 'Tamirde',         cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  tamamlandi:      { label: 'Tamamlandı',      cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  teslim_edildi:   { label: 'Teslim Edildi',   cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  iptal:           { label: 'İptal',           cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const inputCls = "w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-blue-500"

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: c } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (c) {
      setCustomer(c)
      setName(c.full_name)
      setPhone(c.phone ?? '')
      setEmail(c.email ?? '')
      setAddress(c.address ?? '')
    }

    const { data: d } = await supabase
      .from('devices')
      .select('*')
      .eq('customer_id', id)

    setDevices(d ?? [])

    const { data: o } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, created_at,
        devices(brand, model),
        technicians(full_name)
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    setOrders((o as unknown as WorkOrder[]) ?? [])
    setLoading(false)
  }

  async function saveCustomer() {
    setSaving(true)
    await supabase.from('customers').update({
      full_name: name,
      phone,
      email,
      address,
    }).eq('id', id)
    await fetchData()
    setEditing(false)
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-[#333] text-sm">Yükleniyor...</p>
    </div>
  )

  if (!customer) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-[#333] text-sm">Müşteri bulunamadı.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <button onClick={() => router.back()} className="text-[#555] hover:text-white text-sm transition">← Geri</button>
        <span className="text-white font-medium text-sm">{customer.full_name}</span>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sol kolon */}
        <div className="space-y-4">

          {/* Müşteri bilgileri */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#444] text-xs uppercase tracking-wide">Müşteri Bilgileri</p>
              <button
                onClick={() => setEditing(!editing)}
                className="text-[#555] hover:text-white text-xs transition"
              >
                {editing ? 'İptal' : 'Düzenle'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" className={inputCls} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className={inputCls} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" className={inputCls} />
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adres" className={inputCls} />
                <button
                  onClick={saveCustomer}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-white font-medium text-sm">{customer.full_name}</p>
                <p className="text-[#666] text-xs mt-1">{customer.phone ?? '—'}</p>
                <p className="text-[#555] text-xs">{customer.email ?? '—'}</p>
                <p className="text-[#555] text-xs">{customer.address ?? '—'}</p>
                <p className="text-[#333] text-xs mt-2">
                  Kayıt: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                </p>
              </>
            )}
          </div>

          {/* İstatistikler */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[#444] text-xs uppercase tracking-wide mb-3">Özet</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#444] text-[10px] mb-1">Toplam İş</p>
                <p className="text-white text-xl font-medium">{orders.length}</p>
              </div>
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#444] text-[10px] mb-1">Cihaz</p>
                <p className="text-white text-xl font-medium">{devices.length}</p>
              </div>
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#444] text-[10px] mb-1">Aktif İş</p>
                <p className="text-blue-400 text-xl font-medium">
                  {orders.filter(o => ['beklemede','incelemede','tamirde','onay_bekleniyor'].includes(o.status)).length}
                </p>
              </div>
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#444] text-[10px] mb-1">Tamamlanan</p>
                <p className="text-green-400 text-xl font-medium">
                  {orders.filter(o => ['tamamlandi','teslim_edildi'].includes(o.status)).length}
                </p>
              </div>
            </div>
          </div>

          {/* Cihazlar */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[#444] text-xs uppercase tracking-wide mb-3">Cihazlar</p>
            {devices.length === 0 ? (
              <p className="text-[#333] text-xs">Kayıtlı cihaz yok</p>
            ) : (
              <div className="space-y-2">
                {devices.map(d => (
                  <div key={d.id} className="bg-[#111] rounded-lg p-3">
                    <p className="text-white text-xs font-medium">{d.brand} {d.model}</p>
                    {d.serial_number && <p className="text-[#444] text-[11px] font-mono mt-0.5">{d.serial_number}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ kolon — iş emirleri geçmişi */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#444] text-xs uppercase tracking-wide">İş Emirleri Geçmişi</p>
              <Link
                href={`/dashboard/work-orders/new`}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
              >
                + Yeni İş Emri
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="text-[#333] text-xs text-center py-6">Henüz iş emri yok</p>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <div
                    key={o.id}
                    className="bg-[#111] rounded-lg p-3 cursor-pointer hover:bg-white/[0.03] transition"
                    onClick={() => router.push(`/dashboard/work-orders/${o.id}`)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#444] text-[11px]">#{o.order_number}</span>
                        <span className="text-[#666] text-[11px]">
                          {o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'}
                        </span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[o.status]?.cls}`}>
                        {STATUS[o.status]?.label}
                      </span>
                    </div>
                    <p className="text-[#888] text-xs truncate">{o.problem_description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[#333] text-[11px]">{o.technicians?.full_name ?? '—'}</p>
                      <p className="text-[#333] text-[11px]">
                        {new Date(o.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}