'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'

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
  beklemede:       { label: 'Beklemede',       cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  incelemede:      { label: 'İncelemede',      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  onay_bekleniyor: { label: 'Onay Bekleniyor', cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  tamirde:         { label: 'Tamirde',         cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  tamamlandi:      { label: 'Tamamlandı',      cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
  teslim_edildi:   { label: 'Teslim Edildi',   cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  iptal:           { label: 'İptal',           cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [stats, setStats] = useState({ aktif: 0, bekleyen: 0, tamamlanan: 0, bugunYeni: 0 })
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()
  const d = theme === 'dark'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/login'); return }
      fetchData()
    })
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, created_at,
        customers:customer_id(full_name, phone),
        devices:device_id(brand, model),
        technicians:technician_id(full_name)
      `)
      .order('created_at', { ascending: false })

    const all = (data as unknown as WorkOrder[]) ?? []
    const bugun = new Date().toLocaleDateString('tr-TR')

    setOrders(all.slice(0, 10))
    setStats({
      aktif: all.filter(o => ['incelemede', 'tamirde', 'onay_bekleniyor'].includes(o.status)).length,
      bekleyen: all.filter(o => o.status === 'beklemede').length,
      tamamlanan: all.filter(o => ['tamamlandi', 'teslim_edildi'].includes(o.status)).length,
      bugunYeni: all.filter(o => new Date(o.created_at).toLocaleDateString('tr-TR') === bugun).length,
    })
    setReady(true)
  }

  if (!ready) return (
    <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <p className={d ? 'text-[#333]' : 'text-gray-400'}>Yükleniyor...</p>
    </div>
  )

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        {/* İstatistik kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className={`rounded-xl p-4 border ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <p className={`text-[11px] uppercase tracking-wide mb-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Aktif İşler</p>
            <p className="text-blue-500 text-3xl font-medium">{stats.aktif}</p>
            <p className={`text-xs mt-1 ${d ? 'text-[#444]' : 'text-gray-400'}`}>İnceleme + tamir</p>
          </div>
          <div className={`rounded-xl p-4 border ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <p className={`text-[11px] uppercase tracking-wide mb-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Beklemede</p>
            <p className="text-yellow-500 text-3xl font-medium">{stats.bekleyen}</p>
            <p className={`text-xs mt-1 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Atanmayı bekliyor</p>
          </div>
          <div className={`rounded-xl p-4 border ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <p className={`text-[11px] uppercase tracking-wide mb-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Tamamlanan</p>
            <p className="text-green-500 text-3xl font-medium">{stats.tamamlanan}</p>
            <p className={`text-xs mt-1 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Teslim dahil</p>
          </div>
          <div className={`rounded-xl p-4 border ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <p className={`text-[11px] uppercase tracking-wide mb-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Bugün Yeni</p>
            <p className="text-purple-500 text-3xl font-medium">{stats.bugunYeni}</p>
            <p className={`text-xs mt-1 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Bugün açılan</p>
          </div>
        </div>

        {/* Son iş emirleri */}
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>Son İş Emirleri</h2>
          <div className="flex gap-2">
            <Link href="/dashboard/work-orders"
              className={`text-xs px-3 py-1.5 rounded-lg transition ${d ? 'text-[#555] hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
              Tümü →
            </Link>
            <Link href="/dashboard/work-orders/new"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
              + Yeni
            </Link>
          </div>
        </div>

        {/* Masaüstü tablo */}
        <div className={`hidden sm:block rounded-xl border overflow-hidden ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                {['#', 'Müşteri', 'Cihaz', 'Sorun', 'Teknisyen', 'Durum', 'Tarih'].map(h => (
                  <th key={h} className={`text-left px-4 py-3 font-medium ${d ? 'text-[#444]' : 'text-gray-400'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
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
                  <td className={`px-4 py-3 max-w-[160px] truncate ${d ? 'text-[#888]' : 'text-gray-500'}`}>{o.problem_description}</td>
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

        {/* Mobil kartlar */}
        <div className="sm:hidden space-y-2">
          {orders.map(o => (
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
                {o.devices ? `${o.devices.brand} ${o.devices.model}` : '—'} · {o.problem_description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}