'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'

type WorkOrder = {
  id: string
  order_number: number
  status: string
  problem_description: string
  created_at: string
  customers: { full_name: string; phone: string } | null
  devices: { brand: string; model: string; serial_number: string } | null
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

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const { theme } = useTheme()
  const d = theme === 'dark'

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, created_at,
        customers:customer_id(full_name, phone),
        devices:device_id(brand, model, serial_number),
        technicians:technician_id(full_name)
      `)
      .order('created_at', { ascending: false })

    setOrders((data as unknown as WorkOrder[]) ?? [])
    setLoading(false)
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.customers?.full_name?.toLowerCase().includes(q) ||
      o.customers?.phone?.includes(q) ||
      o.devices?.brand?.toLowerCase().includes(q) ||
      o.devices?.model?.toLowerCase().includes(q) ||
      o.devices?.serial_number?.toLowerCase().includes(q) ||
      o.problem_description?.toLowerCase().includes(q) ||
      o.technicians?.full_name?.toLowerCase().includes(q) ||
      o.order_number?.toString().includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const inputCls = `border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#1a1a1a] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>İş Emirleri</h2>
          <Link href="/dashboard/work-orders/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
            + Yeni İş Emri
          </Link>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Müşteri, telefon, cihaz, seri no, teknisyen ara..."
            className={inputCls + ' flex-1'}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {search || statusFilter ? (
          <p className={`text-xs mb-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>{filtered.length} sonuç bulundu</p>
        ) : null}

        {loading ? (
          <p className={`text-sm ${d ? 'text-[#444]' : 'text-gray-400'}`}>Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-20 text-sm ${d ? 'text-[#444]' : 'text-gray-400'}`}>
            <p>{search || statusFilter ? 'Sonuç bulunamadı' : 'Henüz iş emri yok'}</p>
          </div>
        ) : (
          <>
            <div className={`hidden sm:block rounded-xl border overflow-hidden ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                    {['#', 'Müşteri', 'Cihaz', 'Seri No', 'Sorun', 'Teknisyen', 'Durum', 'Tarih'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 font-medium ${d ? 'text-[#444]' : 'text-gray-400'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}
                      className={`border-b last:border-0 cursor-pointer transition ${d ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50'}`}
                      onClick={() => router.push(`/dashboard/work-orders/${o.id}`)}>
                      <td className={`px-4 py-3 font-mono ${d ? 'text-[#444]' : 'text-gray-400'}`}>#{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{o.customers?.full_name ?? '—'}</p>
                        <p className={`mt-0.5 ${d ? 'text-[#444]' : 'text-gray-400'}`}>{o.customers?.phone}</p>
                      </td>
                      <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>
                        {o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'}
                      </td>
                      <td className={`px-4 py-3 font-mono text-[11px] ${d ? 'text-[#666]' : 'text-gray-400'}`}>
                        {o.devices?.serial_number ?? '—'}
                      </td>
                      <td className={`px-4 py-3 max-w-[140px] truncate ${d ? 'text-[#888]' : 'text-gray-500'}`}>{o.problem_description}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#888]' : 'text-gray-500'}`}>{o.technicians?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[o.status]?.cls}`}>
                          {STATUS[o.status]?.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>
                        {new Date(o.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-2">
              {filtered.map(o => (
                <div key={o.id}
                  className={`rounded-xl border p-4 cursor-pointer active:scale-[0.99] transition ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}
                  onClick={() => router.push(`/dashboard/work-orders/${o.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`font-mono text-xs ${d ? 'text-[#444]' : 'text-gray-400'}`}>#{o.order_number}</span>
                      <p className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{o.customers?.full_name ?? '—'}</p>
                      <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{o.customers?.phone}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[o.status]?.cls}`}>
                      {STATUS[o.status]?.label}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${d ? 'text-[#555]' : 'text-gray-400'}`}>
                    {o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'}
                    {o.devices?.serial_number ? ` · ${o.devices.serial_number}` : ''}
                  </p>
                  <p className={`text-xs truncate mt-0.5 ${d ? 'text-[#444]' : 'text-gray-400'}`}>{o.problem_description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}