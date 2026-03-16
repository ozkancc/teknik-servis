'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Customer = { id: string; full_name: string; phone: string }
type Device = { id: string; brand: string; model: string }
type Technician = { id: string; full_name: string }

export default function NewWorkOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [customerId, setCustomerId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [tab, setTab] = useState<'mevcut' | 'yeni'>('mevcut')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAddress, setNewAddress] = useState('')

  const [deviceTab, setDeviceTab] = useState<'mevcut' | 'yeni'>('mevcut')
  const [newBrand, setNewBrand] = useState('')
  const [newModel, setNewModel] = useState('')
  const [newSerial, setNewSerial] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const inputClass = "w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"

  useEffect(() => {
    supabase.from('customers').select('id, full_name, phone').order('full_name').then(({ data }) => setCustomers(data ?? []))
    supabase.from('technicians').select('id, full_name').eq('is_active', true).then(({ data }) => setTechnicians(data ?? []))
  }, [])

  useEffect(() => {
    if (!customerId) { setDevices([]); setDeviceId(''); return }
    supabase.from('devices').select('id, brand, model').eq('customer_id', customerId).then(({ data }) => setDevices(data ?? []))
  }, [customerId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let finalCustomerId = customerId

    // Yeni müşteri kaydı
    if (tab === 'yeni') {
      if (!newName) { setError('Müşteri adı zorunlu'); setLoading(false); return }
      const { data, error } = await supabase
        .from('customers')
        .insert({ full_name: newName, phone: newPhone, email: newEmail, address: newAddress })
        .select().single()
      if (error || !data) { setError('Müşteri kaydedilemedi'); setLoading(false); return }
      finalCustomerId = data.id
    }

    let finalDeviceId = deviceId || null

    // Yeni cihaz kaydı
    if (deviceTab === 'yeni' && finalCustomerId) {
      if (!newBrand || !newModel) { setError('Marka ve model zorunlu'); setLoading(false); return }
      const { data } = await supabase
        .from('devices')
        .insert({ customer_id: finalCustomerId, brand: newBrand, model: newModel, serial_number: newSerial })
        .select().single()
      if (data) finalDeviceId = data.id
    }

    const { error: woError } = await supabase.from('work_orders').insert({
      customer_id: finalCustomerId,
      device_id: finalDeviceId,
      technician_id: technicianId || null,
      problem_description: problem,
      status: 'beklemede',
    })

    if (woError) { setError('İş emri oluşturulamadı: ' + woError.message); setLoading(false); return }
const { data: newOrder } = await supabase
      .from('work_orders')
      .select('order_number, customers(full_name, email), devices(brand, model)')
      .eq('customer_id', finalCustomerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (newOrder && (newOrder as any).customers?.email) {
      const c = (newOrder as any).customers
      const d = (newOrder as any).devices
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: c.email,
          customerName: c.full_name,
          orderNumber: (newOrder as any).order_number,
          status: 'beklemede',
          deviceName: d ? `${d.brand} ${d.model}` : '',
          message: 'İş emriniz oluşturuldu. En kısa sürede cihazınızı inceleyeceğiz.',
        }),
      })
    }    
router.push('/dashboard/work-orders')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="bg-[#141414] border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-white text-sm transition">← Geri</button>
        <h1 className="text-white font-semibold">Yeni İş Emri</h1>
      </div>

      <div className="p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Müşteri */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-semibold">Müşteri</h2>
              <div className="flex bg-[#1f1f1f] rounded-lg p-0.5 text-xs">
                <button type="button" onClick={() => setTab('mevcut')}
                  className={`px-3 py-1.5 rounded-md transition ${tab === 'mevcut' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  Mevcut
                </button>
                <button type="button" onClick={() => setTab('yeni')}
                  className={`px-3 py-1.5 rounded-md transition ${tab === 'yeni' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  Yeni Kayıt
                </button>
              </div>
            </div>

            {tab === 'mevcut' ? (
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputClass} required>
                <option value="">Müşteri seçin...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
              </select>
            ) : (
              <div className="space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ad Soyad *" className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Telefon" className={inputClass} />
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="E-posta" className={inputClass} />
                </div>
                <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Adres" className={inputClass} />
              </div>
            )}
          </div>

          {/* Cihaz */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-sm font-semibold">Cihaz</h2>
              <div className="flex bg-[#1f1f1f] rounded-lg p-0.5 text-xs">
                <button type="button" onClick={() => setDeviceTab('mevcut')}
                  className={`px-3 py-1.5 rounded-md transition ${deviceTab === 'mevcut' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  Mevcut
                </button>
                <button type="button" onClick={() => setDeviceTab('yeni')}
                  className={`px-3 py-1.5 rounded-md transition ${deviceTab === 'yeni' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  Yeni Kayıt
                </button>
              </div>
            </div>

            {deviceTab === 'mevcut' ? (
              <>
                <select value={deviceId} onChange={e => setDeviceId(e.target.value)} className={inputClass} disabled={tab === 'mevcut' && !customerId}>
                  <option value="">Cihaz seçin...</option>
                  {devices.map(d => <option key={d.id} value={d.id}>{d.brand} {d.model}</option>)}
                </select>
                {tab === 'mevcut' && !customerId && <p className="text-gray-600 text-xs mt-2">Önce müşteri seçin</p>}
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Marka * (Dell, HP...)" className={inputClass} />
                  <input value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="Model * (Inspiron 15)" className={inputClass} />
                </div>
                <input value={newSerial} onChange={e => setNewSerial(e.target.value)} placeholder="Seri Numarası" className={inputClass} />
              </div>
            )}
          </div>

          {/* Teknisyen + Sorun */}
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Teknisyen</label>
              <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={inputClass}>
                <option value="">Seçin...</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sorun Açıklaması *</label>
              <textarea value={problem} onChange={e => setProblem(e.target.value)} rows={3}
                className={inputClass + ' resize-none'} placeholder="Müşterinin bildirdiği sorun..." required />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : 'İş Emri Oluştur'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="bg-white/10 hover:bg-white/15 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}