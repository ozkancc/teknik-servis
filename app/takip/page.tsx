'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

type WorkOrder = {
  id: string
  order_number: number
  status: string
  problem_description: string
  diagnosis: string
  created_at: string
  devices: { brand: string; model: string; serial_number: string } | null
  technicians: { full_name: string } | null
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  beklemede:       { label: 'Beklemede',       color: '#f59e0b', bg: '#fef3c7' },
  incelemede:      { label: 'İncelemede',      color: '#3b82f6', bg: '#dbeafe' },
  onay_bekleniyor: { label: 'Onay Bekleniyor', color: '#f97316', bg: '#ffedd5' },
  tamirde:         { label: 'Tamirde',         color: '#8b5cf6', bg: '#ede9fe' },
  tamamlandi:      { label: 'Tamamlandı',      color: '#10b981', bg: '#d1fae5' },
  teslim_edildi:   { label: 'Teslim Edildi',   color: '#6b7280', bg: '#f3f4f6' },
  iptal:           { label: 'İptal',           color: '#ef4444', bg: '#fee2e2' },
}

const STEPS = ['beklemede', 'incelemede', 'onay_bekleniyor', 'tamirde', 'tamamlandi', 'teslim_edildi']

export default function TakipPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!phone) return
    setLoading(true)
    setError('')
    setSearched(false)

    const supabase = createClient()
    const digits = phone.replace(/\D/g, '').slice(-10)
    

    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, full_name')
      .ilike('phone', `%${digits}%`)
      .limit(1)

    

    if (!customers || customers.length === 0) {
      setError('Bu telefon numarasına kayıtlı cihaz bulunamadı.')
      setOrders([])
      setLoading(false)
      setSearched(true)
      return
    }

    const customer = customers[0]
    setCustomerName(customer.full_name)

    const { data, error: ordErr } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, diagnosis, created_at,
        devices:device_id(brand, model, serial_number),
        technicians:technician_id(full_name)
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    

    setOrders((data as unknown as WorkOrder[]) ?? [])
    setLoading(false)
    setSearched(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <Image src="/logo.png" alt="Gen Teknik Servis" width={120} height={40} style={{ objectFit: 'contain' }} />
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111', margin: '0 0 8px' }}>
            Cihaz Durumu Sorgulama
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Telefon numaranızı girerek cihazınızın servis durumunu öğrenin
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
            Telefon Numarası
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="0532 123 4567"
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '15px', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Aranıyor...' : 'Sorgula'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {searched && orders.length > 0 && (
          <div>
            <p style={{ color: '#374151', fontSize: '14px', marginBottom: '16px' }}>
              Merhaba <strong>{customerName}</strong>, {orders.length} iş emri bulundu.
            </p>

            {orders.map(o => {
              const st = STATUS[o.status]
              const stepIndex = STEPS.indexOf(o.status)

              return (
                <div key={o.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px', overflow: 'hidden' }}>

                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'monospace' }}>#{o.order_number}</span>
                      <p style={{ margin: '2px 0 0', fontWeight: '600', fontSize: '15px', color: '#111' }}>
                        {o.devices ? `${o.devices.brand} ${o.devices.model}` : 'Cihaz bilgisi yok'}
                      </p>
                      {o.devices?.serial_number && (
                        <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: '12px', fontFamily: 'monospace' }}>
                          Seri: {o.devices.serial_number}
                        </p>
                      )}
                    </div>
                    <span style={{ background: st?.bg, color: st?.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {st?.label}
                    </span>
                  </div>

                  {o.status !== 'iptal' && (
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {STEPS.slice(0, 5).map((step, i) => (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: i <= stepIndex ? '#dc2626' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {i <= stepIndex && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            {i < 4 && <div style={{ flex: 1, height: '2px', background: i < stepIndex ? '#dc2626' : '#e5e7eb', margin: '0 2px' }} />}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        {['Alındı', 'İnceleme', 'Onay', 'Tamir', 'Hazır'].map((label, i) => (
                          <span key={label} style={{ fontSize: '10px', color: i <= stepIndex ? '#dc2626' : '#9ca3af', fontWeight: i <= stepIndex ? '600' : '400', flex: 1, textAlign: i === 0 ? 'left' : i === 4 ? 'right' : 'center' }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Sorun</span>
                      <p style={{ margin: '2px 0 0', color: '#374151', fontSize: '13px' }}>{o.problem_description}</p>
                    </div>
                    {o.diagnosis && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Teşhis</span>
                        <p style={{ margin: '2px 0 0', color: '#374151', fontSize: '13px' }}>{o.diagnosis}</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>Teknisyen: {o.technicians?.full_name ?? '—'}</span>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(o.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px' }}>Gen Teknik Servis · Bilgisayar - Telefon - Tablet</p>
        </div>
      </div>
    </div>
  )
}