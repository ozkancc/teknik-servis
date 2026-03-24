'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/context/ThemeContext'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

type Customer = { id: string; full_name: string; phone: string }
type Device = { id: string; brand: string; model: string; device_type: string }
type Technician = { id: string; full_name: string }

const DEVICE_TYPES: Record<string, string> = {
  notebook: 'Notebook',
  tablet: 'Tablet',
  cep_telefonu: 'Cep Telefonu',
  oem_kasa: 'OEM Kasa',
  kasa: 'Kasa',
  elektronik_kart: 'Elektronik Kart',
  diger: 'Diğer',
}

export default function NewWorkOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [customerId, setCustomerId] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const [tab, setTab] = useState<'mevcut' | 'yeni'>('mevcut')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAddress, setNewAddress] = useState('')

  const [deviceTab, setDeviceTab] = useState<'mevcut' | 'yeni'>('mevcut')
  const [newBrand, setNewBrand] = useState('')
  const [newModel, setNewModel] = useState('')
  const [newSerial, setNewSerial] = useState('')
  const [newDeviceType, setNewDeviceType] = useState('diger')

  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()
  const d = theme === 'dark'

  const inputCls = `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`
  const cardCls = `rounded-xl border p-5 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`
  const tabActiveCls = `px-3 py-1.5 rounded-md transition text-xs ${d ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-900'}`
  const tabInactiveCls = `px-3 py-1.5 rounded-md transition text-xs ${d ? 'text-[#555] hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`

  useEffect(() => {
    supabase.from('customers').select('id, full_name, phone').order('full_name').then(({ data }) => setCustomers(data ?? []))
    supabase.from('technicians').select('id, full_name').eq('is_active', true).then(({ data }) => setTechnicians(data ?? []))
  }, [])

  useEffect(() => {
    if (!customerId) { setDevices([]); setDeviceId(''); return }
    supabase.from('devices').select('id, brand, model, device_type').eq('customer_id', customerId).then(({ data }) => setDevices(data ?? []))
  }, [customerId])

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase()
    return !q || c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q)
  })

  function selectCustomer(c: Customer) {
    setCustomerId(c.id)
    setSelectedCustomer(c)
    setCustomerSearch('')
    setShowCustomerList(false)
  }

  function clearCustomer() {
    setCustomerId('')
    setSelectedCustomer(null)
    setCustomerSearch('')
    setDevices([])
    setDeviceId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let finalCustomerId = customerId

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

    if (deviceTab === 'yeni' && finalCustomerId) {
      if (!newBrand || !newModel) { setError('Marka ve model zorunlu'); setLoading(false); return }
      const { data } = await supabase
        .from('devices')
        .insert({
          customer_id: finalCustomerId,
          brand: newBrand,
          model: newModel,
          serial_number: newSerial,
          device_type: newDeviceType,
        })
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
    router.push('/dashboard/work-orders')
  }

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />

      <div className={`border-b px-4 sm:px-6 py-4 flex items-center gap-3 ${d ? 'bg-[#0f0f0f] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
        <button onClick={() => router.back()} className={`text-sm transition ${d ? 'text-[#555] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>← Geri</button>
        <h1 className={`font-semibold text-sm ${d ? 'text-white' : 'text-gray-900'}`}>Yeni İş Emri</h1>
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Müşteri */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>Müşteri</h2>
              <div className={`flex rounded-lg p-0.5 ${d ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>
                <button type="button" onClick={() => { setTab('mevcut'); clearCustomer() }}
                  className={tab === 'mevcut' ? tabActiveCls : tabInactiveCls}>Mevcut</button>
                <button type="button" onClick={() => { setTab('yeni'); clearCustomer() }}
                  className={tab === 'yeni' ? tabActiveCls : tabInactiveCls}>Yeni Kayıt</button>
              </div>
            </div>

            {tab === 'mevcut' ? (
              <div className="relative">
                {selectedCustomer ? (
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${d ? 'bg-[#111] border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{selectedCustomer.full_name}</p>
                      <p className={`text-xs ${d ? 'text-[#666]' : 'text-gray-400'}`}>{selectedCustomer.phone}</p>
                    </div>
                    <button type="button" onClick={clearCustomer}
                      className={`text-xs transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-300 hover:text-gray-600'}`}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setShowCustomerList(true) }}
                      onFocus={() => setShowCustomerList(true)}
                      placeholder="İsim veya telefon ile ara..."
                      className={inputCls}
                    />
                    {showCustomerList && (
                      <div className={`absolute z-10 w-full mt-1 rounded-xl border shadow-lg overflow-hidden max-h-60 overflow-y-auto ${d ? 'bg-[#1a1a1a] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
                        {filteredCustomers.length === 0 ? (
                          <p className={`text-xs px-4 py-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Sonuç bulunamadı</p>
                        ) : (
                          filteredCustomers.map(c => (
                            <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                              className={`w-full text-left px-4 py-2.5 transition border-b last:border-0 ${d ? 'border-white/[0.04] hover:bg-white/[0.05]' : 'border-gray-50 hover:bg-gray-50'}`}>
                              <p className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{c.full_name}</p>
                              <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{c.phone}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ad Soyad *" className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Telefon" className={inputCls} />
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="E-posta" className={inputCls} />
                </div>
                <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Adres" className={inputCls} />
              </div>
            )}
          </div>

          {/* Cihaz */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>Cihaz</h2>
              <div className={`flex rounded-lg p-0.5 ${d ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>
                <button type="button" onClick={() => setDeviceTab('mevcut')}
                  className={deviceTab === 'mevcut' ? tabActiveCls : tabInactiveCls}>Mevcut</button>
                <button type="button" onClick={() => setDeviceTab('yeni')}
                  className={deviceTab === 'yeni' ? tabActiveCls : tabInactiveCls}>Yeni Kayıt</button>
              </div>
            </div>

            {deviceTab === 'mevcut' ? (
              <>
                <select value={deviceId} onChange={e => setDeviceId(e.target.value)} className={inputCls}
                  disabled={tab === 'mevcut' && !customerId}>
                  <option value="">Cihaz seçin...</option>
                  {devices.map(dv => (
                    <option key={dv.id} value={dv.id}>
                      {dv.brand} {dv.model} {dv.device_type ? `(${DEVICE_TYPES[dv.device_type] ?? ''})` : ''}
                    </option>
                  ))}
                </select>
                {tab === 'mevcut' && !customerId && (
                  <p className={`text-xs mt-2 ${d ? 'text-[#555]' : 'text-gray-400'}`}>Önce müşteri seçin</p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <select value={newDeviceType} onChange={e => setNewDeviceType(e.target.value)} className={inputCls}>
                  {Object.entries(DEVICE_TYPES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Marka *" className={inputCls} />
                  <input value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="Model *" className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    placeholder="Seri Numarası"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className={`px-3 rounded-lg border transition flex items-center justify-center ${d ? 'bg-[#1f1f1f] border-white/10 text-[#666] hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700'}`}
                    title="Barkod okut"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Teknisyen + Sorun */}
          <div className={cardCls + ' space-y-4'}>
            <div>
              <label className={`block text-sm mb-1 ${d ? 'text-[#888]' : 'text-gray-500'}`}>Teknisyen</label>
              <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={inputCls}>
                <option value="">Seçin...</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${d ? 'text-[#888]' : 'text-gray-500'}`}>Sorun Açıklaması *</label>
              <textarea value={problem} onChange={e => setProblem(e.target.value)} rows={3}
                className={inputCls + ' resize-none'} placeholder="Müşterinin bildirdiği sorun..." required />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : 'İş Emri Oluştur'}
            </button>
            <button type="button" onClick={() => router.back()}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${d ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              İptal
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(result) => {
            setNewSerial(result)
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}