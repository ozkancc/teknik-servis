'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'
import * as XLSX from 'xlsx'

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const { theme } = useTheme()
  const d = theme === 'dark'

  const cardCls = `rounded-xl border p-5 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`

  async function exportWorkOrders() {
    setLoading('work_orders')
    const { data } = await supabase
      .from('work_orders')
      .select(`
        order_number, status, problem_description, diagnosis, created_at,
        customers:customer_id(full_name, phone, email, address),
        devices:device_id(brand, model, serial_number),
        technicians:technician_id(full_name)
      `)
      .order('created_at', { ascending: false })

    const rows = (data ?? []).map((wo: any) => ({
      'İş Emri No': wo.order_number,
      'Durum': wo.status,
      'Müşteri': wo.customers?.full_name ?? '',
      'Telefon': wo.customers?.phone ?? '',
      'E-posta': wo.customers?.email ?? '',
      'Adres': wo.customers?.address ?? '',
      'Cihaz Marka': wo.devices?.brand ?? '',
      'Cihaz Model': wo.devices?.model ?? '',
      'Seri No': wo.devices?.serial_number ?? '',
      'Teknisyen': wo.technicians?.full_name ?? '',
      'Sorun': wo.problem_description ?? '',
      'Teşhis': wo.diagnosis ?? '',
      'Tarih': new Date(wo.created_at).toLocaleDateString('tr-TR'),
    }))

    downloadExcel(rows, 'is-emirleri')
    setLoading(null)
  }

  async function exportCustomers() {
    setLoading('customers')
    const { data } = await supabase.from('customers').select('*').order('full_name')

    const rows = (data ?? []).map((c: any) => ({
      'Ad Soyad': c.full_name,
      'Telefon': c.phone ?? '',
      'E-posta': c.email ?? '',
      'Adres': c.address ?? '',
      'Kayıt Tarihi': new Date(c.created_at).toLocaleDateString('tr-TR'),
    }))

    downloadExcel(rows, 'musteriler')
    setLoading(null)
  }

  async function exportParts() {
    setLoading('parts')
    const { data } = await supabase.from('parts').select('*').order('name')

    const rows = (data ?? []).map((p: any) => ({
      'Parça Adı': p.name,
      'Açıklama': p.description ?? '',
      'Birim': p.unit,
      'Liste Fiyatı': p.list_price,
      'Stok Miktarı': p.stock_quantity,
      'Durum': p.is_active ? 'Aktif' : 'Pasif',
    }))

    downloadExcel(rows, 'parcalar')
    setLoading(null)
  }

  async function exportAll() {
    setLoading('all')

    const [woRes, custRes, partsRes] = await Promise.all([
      supabase.from('work_orders').select(`
        order_number, status, problem_description, diagnosis, created_at,
        customers:customer_id(full_name, phone, email, address),
        devices:device_id(brand, model, serial_number),
        technicians:technician_id(full_name)
      `).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('full_name'),
      supabase.from('parts').select('*').order('name'),
    ])

    const wb = XLSX.utils.book_new()

    const woRows = (woRes.data ?? []).map((wo: any) => ({
      'İş Emri No': wo.order_number,
      'Durum': wo.status,
      'Müşteri': wo.customers?.full_name ?? '',
      'Telefon': wo.customers?.phone ?? '',
      'Cihaz': `${wo.devices?.brand ?? ''} ${wo.devices?.model ?? ''}`,
      'Seri No': wo.devices?.serial_number ?? '',
      'Teknisyen': wo.technicians?.full_name ?? '',
      'Sorun': wo.problem_description ?? '',
      'Teşhis': wo.diagnosis ?? '',
      'Tarih': new Date(wo.created_at).toLocaleDateString('tr-TR'),
    }))

    const custRows = (custRes.data ?? []).map((c: any) => ({
      'Ad Soyad': c.full_name,
      'Telefon': c.phone ?? '',
      'E-posta': c.email ?? '',
      'Adres': c.address ?? '',
      'Kayıt Tarihi': new Date(c.created_at).toLocaleDateString('tr-TR'),
    }))

    const partsRows = (partsRes.data ?? []).map((p: any) => ({
      'Parça Adı': p.name,
      'Açıklama': p.description ?? '',
      'Birim': p.unit,
      'Liste Fiyatı': p.list_price,
      'Stok Miktarı': p.stock_quantity,
      'Durum': p.is_active ? 'Aktif' : 'Pasif',
    }))

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(woRows), 'İş Emirleri')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custRows), 'Müşteriler')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partsRows), 'Parçalar')

    const tarih = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')
    XLSX.writeFile(wb, `teknik-servis-yedek-${tarih}.xlsx`)
    setLoading(null)
  }

  function downloadExcel(rows: any[], filename: string) {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Veri')
    const tarih = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')
    XLSX.writeFile(wb, `${filename}-${tarih}.xlsx`)
  }

  const cards = [
    { key: 'work_orders', title: 'İş Emirleri', desc: 'Tüm iş emirleri, müşteri, cihaz ve teknisyen bilgileriyle', action: exportWorkOrders },
    { key: 'customers', title: 'Müşteriler', desc: 'Tüm müşteri kayıtları ve iletişim bilgileri', action: exportCustomers },
    { key: 'parts', title: 'Stok & Parçalar', desc: 'Tüm parça katalogu ve stok miktarları', action: exportParts },
  ]

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>Veri Dışa Aktar</h2>
            <p className={`text-xs mt-1 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Excel formatında indirin, yedekleyin veya başka sisteme aktarın</p>
          </div>
          <button
            onClick={exportAll}
            disabled={!!loading}
            className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 font-medium"
          >
            {loading === 'all' ? 'Hazırlanıyor...' : 'Tümünü İndir'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {cards.map(card => (
            <div key={card.key} className={cardCls}>
              <h3 className={`text-sm font-medium mb-1 ${d ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
              <p className={`text-xs mb-4 leading-relaxed ${d ? 'text-[#555]' : 'text-gray-400'}`}>{card.desc}</p>
              <button
                onClick={card.action}
                disabled={!!loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading === card.key ? 'İndiriliyor...' : 'Excel İndir'}
              </button>
            </div>
          ))}
        </div>

        <div className={cardCls}>
          <h3 className={`text-sm font-medium mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>Başka sisteme aktarım hakkında</h3>
          <div className={`space-y-2 text-xs leading-relaxed ${d ? 'text-[#555]' : 'text-gray-400'}`}>
            <p>İndirdiğiniz Excel dosyası evrensel formattadır — Google Sheets, Microsoft Excel veya herhangi bir muhasebe programına aktarabilirsiniz.</p>
            <p>Tüm verileriniz Supabase'de güvende tutulmaktadır. Supabase ücretsiz planda son 24 saatin yedeği otomatik alınır.</p>
            <p>Verilerinizi başka bir Supabase projesine veya farklı bir veritabanına taşımak isterseniz yardımcı olabilirim.</p>
          </div>
        </div>

      </div>
    </div>
  )
}