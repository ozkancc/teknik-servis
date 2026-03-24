'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useTheme } from '@/app/context/ThemeContext'

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
  device_type: string
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
  beklemede:       { label: 'Beklemede',       cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  incelemede:      { label: 'İncelemede',      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  onay_bekleniyor: { label: 'Onay Bekleniyor', cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  tamirde:         { label: 'Tamirde',         cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  tamamlandi:      { label: 'Tamamlandı',      cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
  teslim_edildi:   { label: 'Teslim Edildi',   cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  iptal:           { label: 'İptal',           cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

const DEVICE_TYPES: Record<string, string> = {
  notebook: 'Notebook',
  tablet: 'Tablet',
  cep_telefonu: 'Cep Telefonu',
  oem_kasa: 'OEM Kasa',
  kasa: 'Kasa',
  elektronik_kart: 'Elektronik Kart',
  diger: 'Diğer',
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()
  const d = theme === 'dark'

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

  const [showDeviceForm, setShowDeviceForm] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [devBrand, setDevBrand] = useState('')
  const [devModel, setDevModel] = useState('')
  const [devSerial, setDevSerial] = useState('')
  const [devNotes, setDevNotes] = useState('')
  const [devType, setDevType] = useState('diger')
  const [savingDevice, setSavingDevice] = useState(false)

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#111] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`
  const cardCls = `rounded-xl border p-4 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: c } = await supabase.from('customers').select('*').eq('id', id).single()
    if (c) {
      setCustomer(c)
      setName(c.full_name)
      setPhone(c.phone ?? '')
      setEmail(c.email ?? '')
      setAddress(c.address ?? '')
    }

    const { data: dv } = await supabase.from('devices').select('*').eq('customer_id', id).order('brand')
    setDevices(dv ?? [])

    const { data: o } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, created_at,
        devices:device_id(brand, model),
        technicians:technician_id(full_name)
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    setOrders((o as unknown as WorkOrder[]) ?? [])
    setLoading(false)
  }

  async function saveCustomer() {
    setSaving(true)
    await supabase.from('customers').update({ full_name: name, phone, email, address }).eq('id', id)
    await fetchData()
    setEditing(false)
    setSaving(false)
  }

  function openDeviceForm(device?: Device) {
    if (device) {
      setEditingDevice(device)
      setDevBrand(device.brand)
      setDevModel(device.model)
      setDevSerial(device.serial_number ?? '')
      setDevNotes(device.notes ?? '')
      setDevType(device.device_type ?? 'diger')
    } else {
      setEditingDevice(null)
      setDevBrand('')
      setDevModel('')
      setDevSerial('')
      setDevNotes('')
      setDevType('diger')
    }
    setShowDeviceForm(true)
  }

  async function saveDevice() {
    if (!devBrand || !devModel) return
    setSavingDevice(true)
    if (editingDevice) {
      await supabase.from('devices').update({
        brand: devBrand,
        model: devModel,
        serial_number: devSerial,
        notes: devNotes,
        device_type: devType,
      }).eq('id', editingDevice.id)
    } else {
      await supabase.from('devices').insert({
        customer_id: id,
        brand: devBrand,
        model: devModel,
        serial_number: devSerial,
        notes: devNotes,
        device_type: devType,
      })
    }
    setShowDeviceForm(false)
    setEditingDevice(null)
    await fetchData()
    setSavingDevice(false)
  }

  async function deleteDevice(deviceId: string) {
    if (!confirm('Bu cihazı silmek istediğinize emin misiniz?')) return
    await supabase.from('devices').delete().eq('id', deviceId)
    await fetchData()
  }

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <p className={d ? 'text-[#333]' : 'text-gray-400'}>Yükleniyor...</p>
    </div>
  )

  if (!customer) return (
    <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <p className={d ? 'text-[#333]' : 'text-gray-400'}>Müşteri bulunamadı.</p>
    </div>
  )

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />

      <div className={`px-4 sm:px-6 py-4 flex items-center gap-3 border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <button onClick={() => router.back()} className={`text-sm transition ${d ? 'text-[#555] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>← Geri</button>
        <span className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{customer.full_name}</span>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="space-y-4">

          {/* Müşteri bilgileri */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs uppercase tracking-wide ${d ? 'text-[#444]' : 'text-gray-400'}`}>Müşteri Bilgileri</p>
              <button onClick={() => setEditing(!editing)}
                className={`text-xs transition ${d ? 'text-[#555] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                {editing ? 'İptal' : 'Düzenle'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" className={inputCls} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className={inputCls} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" className={inputCls} />
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adres" className={inputCls} />
                <button onClick={saveCustomer} disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            ) : (
              <>
                <p className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{customer.full_name}</p>
                <p className={`text-xs mt-1 ${d ? 'text-[#666]' : 'text-gray-500'}`}>{customer.phone ?? '—'}</p>
                <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{customer.email ?? '—'}</p>
                <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{customer.address ?? '—'}</p>
                <p className={`text-xs mt-2 ${d ? 'text-[#333]' : 'text-gray-300'}`}>
                  Kayıt: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                </p>
              </>
            )}
          </div>

          {/* İstatistikler */}
          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Özet</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Toplam İş', value: orders.length, color: d ? 'text-white' : 'text-gray-900' },
                { label: 'Cihaz', value: devices.length, color: d ? 'text-white' : 'text-gray-900' },
                { label: 'Aktif İş', value: orders.filter(o => ['beklemede','incelemede','tamirde','onay_bekleniyor'].includes(o.status)).length, color: 'text-blue-500' },
                { label: 'Tamamlanan', value: orders.filter(o => ['tamamlandi','teslim_edildi'].includes(o.status)).length, color: 'text-green-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-lg p-3 ${d ? 'bg-[#111]' : 'bg-gray-50'}`}>
                  <p className={`text-[10px] mb-1 ${d ? 'text-[#444]' : 'text-gray-400'}`}>{label}</p>
                  <p className={`text-xl font-medium ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cihazlar */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs uppercase tracking-wide ${d ? 'text-[#444]' : 'text-gray-400'}`}>Cihazlar</p>
              <button onClick={() => openDeviceForm()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
                + Ekle
              </button>
            </div>

            {showDeviceForm && (
              <div className={`rounded-lg p-3 mb-3 border space-y-2 ${d ? 'bg-[#111] border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-medium mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>
                  {editingDevice ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}
                </p>
                <select value={devType} onChange={e => setDevType(e.target.value)} className={inputCls}>
                  {Object.entries(DEVICE_TYPES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={devBrand} onChange={e => setDevBrand(e.target.value)} placeholder="Marka *" className={inputCls} />
                  <input value={devModel} onChange={e => setDevModel(e.target.value)} placeholder="Model *" className={inputCls} />
                </div>
                <input value={devSerial} onChange={e => setDevSerial(e.target.value)} placeholder="Seri Numarası" className={inputCls} />
                <input value={devNotes} onChange={e => setDevNotes(e.target.value)} placeholder="Notlar" className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={saveDevice} disabled={savingDevice || !devBrand || !devModel}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition disabled:opacity-50">
                    {savingDevice ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button onClick={() => { setShowDeviceForm(false); setEditingDevice(null) }}
                    className={`flex-1 text-xs py-2 rounded-lg transition border ${d ? 'border-white/10 text-white hover:bg-white/10' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    İptal
                  </button>
                </div>
              </div>
            )}

            {devices.length === 0 ? (
              <p className={`text-xs ${d ? 'text-[#333]' : 'text-gray-300'}`}>Kayıtlı cihaz yok</p>
            ) : (
              <div className="space-y-2">
                {devices.map(dv => (
                  <div key={dv.id} className={`rounded-lg p-3 ${d ? 'bg-[#111]' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-xs font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{dv.brand} {dv.model}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${d ? 'bg-white/5 border-white/10 text-[#666]' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                            {DEVICE_TYPES[dv.device_type] ?? 'Diğer'}
                          </span>
                        </div>
                        {dv.serial_number && (
                          <p className={`text-[11px] font-mono mt-0.5 ${d ? 'text-[#444]' : 'text-gray-400'}`}>{dv.serial_number}</p>
                        )}
                        {dv.notes && (
                          <p className={`text-[11px] mt-0.5 ${d ? 'text-[#555]' : 'text-gray-400'}`}>{dv.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2 shrink-0">
                        <button onClick={() => openDeviceForm(dv)}
                          className={`text-[11px] transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                          Düzenle
                        </button>
                        <button onClick={() => deleteDevice(dv.id)}
                          className="text-[11px] text-red-400 hover:text-red-500 transition">
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ kolon */}
        <div className="lg:col-span-2">
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-xs uppercase tracking-wide ${d ? 'text-[#444]' : 'text-gray-400'}`}>İş Emirleri Geçmişi</p>
              <Link href="/dashboard/work-orders/new"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
                + Yeni İş Emri
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className={`text-xs text-center py-6 ${d ? 'text-[#333]' : 'text-gray-300'}`}>Henüz iş emri yok</p>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.id}
                    className={`rounded-lg p-3 cursor-pointer transition ${d ? 'bg-[#111] hover:bg-white/[0.03]' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => router.push(`/dashboard/work-orders/${o.id}`)}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] ${d ? 'text-[#444]' : 'text-gray-400'}`}>#{o.order_number}</span>
                        <span className={`text-[11px] ${d ? 'text-[#666]' : 'text-gray-400'}`}>
                          {o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'}
                        </span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[o.status]?.cls}`}>
                        {STATUS[o.status]?.label}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${d ? 'text-[#888]' : 'text-gray-500'}`}>{o.problem_description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[11px] ${d ? 'text-[#333]' : 'text-gray-300'}`}>{o.technicians?.full_name ?? '—'}</p>
                      <p className={`text-[11px] ${d ? 'text-[#333]' : 'text-gray-300'}`}>{new Date(o.created_at).toLocaleDateString('tr-TR')}</p>
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