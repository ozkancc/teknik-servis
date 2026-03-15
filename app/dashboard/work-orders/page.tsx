'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

type WorkOrder = {
  id: string
  order_number: number
  status: string
  problem_description: string
  created_at: string
  customers: { full_name: string; phone: string } | null
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

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, created_at,
        customers(full_name, phone),
        devices(brand, model),
        technicians(full_name)
      `)
      .order('created_at', { ascending: false })

    setOrders((data as WorkOrder[]) ?? [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-medium">İş Emirleri</h2>
          <Link href="/dashboard/work-orders/new"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
            + Yeni İş Emri
          </Link>
        </div>

        {loading ? (
          <p className="text-[#444] text-sm">Yükleniyor...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-[#444]">
            <p className="mb-1">Henüz iş emri yok</p>
            <p className="text-xs">Yeni iş emri oluşturmak için yukarıdaki butonu kullanın</p>
          </div>
        ) : (
          <>
            {/* Masaüstü tablo */}
            <div className="hidden sm:block bg-[#1a1a1a] rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-[#444] font-medium">#</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Müşteri</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Cihaz</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Sorun</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Teknisyen</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Durum</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition last:border-0"
                      onClick={() => router.push(`/dashboard/work-orders/${o.id}`)}>
                      <td className="px-4 py-3 font-mono text-[#444]">#{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{o.customers?.full_name ?? '—'}</p>
                        <p className="text-[#444] mt-0.5">{o.customers?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-[#888]">{o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'}</td>
                      <td className="px-4 py-3 text-[#888] max-w-[180px] truncate">{o.problem_description}</td>
                      <td className="px-4 py-3 text-[#888]">{o.technicians?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[o.status]?.cls}`}>
                          {STATUS[o.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#444]">{new Date(o.created_at).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobil kartlar */}
            <div className="sm:hidden space-y-2">
              {orders.map(o => (
                <div key={o.id}
                  className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4 cursor-pointer active:scale-[0.99] transition"
                  onClick={() => router.push(`/dashboard/work-orders/${o.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-[#444] text-xs">#{o.order_number}</span>
                      <p className="text-white font-medium text-sm">{o.customers?.full_name ?? '—'}</p>
                      <p className="text-[#555] text-xs">{o.customers?.phone}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[o.status]?.cls}`}>
                      {STATUS[o.status]?.label}
                    </span>
                  </div>
                  <p className="text-[#555] text-xs truncate">
                    {o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'} · {o.problem_description}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}