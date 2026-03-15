'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type WorkOrderItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
}

type WorkOrder = {
  id: string
  order_number: number
  status: string
  problem_description: string
  diagnosis: string
  created_at: string
  customers: { full_name: string; phone: string; email: string; address: string } | null
  devices: { brand: string; model: string; serial_number: string } | null
  technicians: { full_name: string } | null
  work_order_items: WorkOrderItem[]
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

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [diagnosis, setDiagnosis] = useState('')

  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newPrice, setNewPrice] = useState('')
  const [newDiscount, setNewDiscount] = useState('0')
  const [saving, setSaving] = useState(false)

  const inputCls = "w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-blue-500"

  useEffect(() => { fetchOrder() }, [])

  async function fetchOrder() {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, diagnosis, created_at,
        customers(full_name, phone, email, address),
        devices(brand, model, serial_number),
        technicians(full_name),
        work_order_items(id, description, quantity, unit_price, discount_percent)
      `)
      .eq('id', id)
      .single()

    if (data) {
      const wo = data as WorkOrder
      setOrder(wo)
      setItems(wo.work_order_items ?? [])
      setStatus(wo.status)
      setDiagnosis(wo.diagnosis ?? '')
    }
    setLoading(false)
  }

  async function addItem() {
    if (!newDesc || !newPrice) return
    setSaving(true)
    await supabase.from('work_order_items').insert({
      work_order_id: id,
      description: newDesc,
      quantity: parseFloat(newQty),
      unit_price: parseFloat(newPrice),
      discount_percent: parseFloat(newDiscount),
    })
    setNewDesc(''); setNewQty('1'); setNewPrice(''); setNewDiscount('0')
    await fetchOrder()
    setSaving(false)
  }

  async function removeItem(itemId: string) {
    await supabase.from('work_order_items').delete().eq('id', itemId)
    await fetchOrder()
  }

  async function updateOrder() {
    await supabase.from('work_orders').update({ status, diagnosis }).eq('id', id)
    alert('Kaydedildi!')
  }

  function calcTotal() {
    return items.reduce((sum, item) => {
      const line = item.quantity * item.unit_price
      return sum + line - line * (item.discount_percent / 100)
    }, 0)
  }

  async function generatePDF() {
    if (!order) return

    const koyu = [15, 15, 15] as [number, number, number]
    const acik = [245, 245, 245] as [number, number, number]
    const mavi = [220, 38, 38] as [number, number, number]

    const logoImg = new window.Image()
    logoImg.src = '/logo.png'
    await new Promise(resolve => { logoImg.onload = resolve })
    const canvas = document.createElement('canvas')
    canvas.width = logoImg.width
    canvas.height = logoImg.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(logoImg, 0, 0)
    const logoData = canvas.toDataURL('image/png')

    const doc = new jsPDF()

    doc.addImage(logoData, 'PNG', 10, 8, 80, 38)

    doc.setTextColor(...koyu)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`Is Emri #${order.order_number}`, 196, 16, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Tarih: ${new Date(order.created_at).toLocaleDateString('tr-TR')}`, 196, 24, { align: 'right' })
    doc.text(`Durum: ${STATUS[order.status]?.label ?? order.status}`, 196, 31, { align: 'right' })

    doc.setDrawColor(220, 38, 38)
    doc.setLineWidth(0.8)
    doc.line(10, 50, 200, 50)

    const rowY = 60
    doc.setFillColor(...acik)
    doc.roundedRect(10, rowY, 88, 38, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('MUSTERI', 14, rowY + 6)
    doc.setTextColor(...koyu)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(order.customers?.full_name ?? '', 14, rowY + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(order.customers?.phone ?? '', 14, rowY + 20)
    doc.text(order.customers?.email ?? '', 14, rowY + 26)
    doc.text(order.customers?.address ?? '', 14, rowY + 32, { maxWidth: 80 })

    doc.setFillColor(...acik)
    doc.roundedRect(104, rowY, 88, 38, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('CiHAZ', 108, rowY + 6)
    doc.setTextColor(...koyu)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`${order.devices?.brand ?? ''} ${order.devices?.model ?? ''}`, 108, rowY + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Seri No: ${order.devices?.serial_number ?? '—'}`, 108, rowY + 20)
    doc.text(`Teknisyen: ${order.technicians?.full_name ?? '—'}`, 108, rowY + 26)

    let curY = rowY + 44
    doc.setFillColor(...acik)
    doc.roundedRect(10, curY, 182, 16, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('SORUN', 14, curY + 6)
    doc.setTextColor(...koyu)
    doc.setFontSize(9)
    doc.text(order.problem_description ?? '', 14, curY + 12, { maxWidth: 174 })

    if (order.diagnosis) {
      curY += 22
      doc.setFillColor(...acik)
      doc.roundedRect(10, curY, 182, 16, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text('TESHIS', 14, curY + 6)
      doc.setTextColor(...koyu)
      doc.setFontSize(9)
      doc.text(order.diagnosis, 14, curY + 12, { maxWidth: 174 })
    }

    curY += 26
    autoTable(doc, {
      startY: curY,
      head: [['ACIKLAMA', 'ADET', 'BiRiM FiYAT', 'iNDiRiM', 'TOPLAM']],
      body: items.map(item => {
        const line = item.quantity * item.unit_price
        const total = line - line * (item.discount_percent / 100)
        return [
          item.description,
          item.quantity.toString(),
          item.unit_price.toFixed(2) + ' TL',
          item.discount_percent > 0 ? '%' + item.discount_percent : '—',
          total.toFixed(2) + ' TL',
        ]
      }),
      foot: [['', '', '', 'GENEL TOPLAM', calcTotal().toFixed(2) + ' TL']],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: mavi, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fontStyle: 'bold', fillColor: acik, textColor: koyu },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 32 },
      },
    })

    const pageH = doc.internal.pageSize.height
    doc.setDrawColor(220, 38, 38)
    doc.setLineWidth(0.8)
    doc.line(10, pageH - 16, 200, pageH - 16)
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    doc.text('Gen Teknik Servis · Bu belge bilgisayar ortaminda olusturulmustur.', 105, pageH - 8, { align: 'center' })

    doc.save(`is-emri-${order.order_number}.pdf`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-[#333] text-sm">Yükleniyor...</p>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-[#333] text-sm">İş emri bulunamadı.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#555] hover:text-white text-sm transition">← Geri</button>
          <span className="text-white font-medium text-sm">İş Emri #{order.order_number}</span>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[order.status]?.cls}`}>
            {STATUS[order.status]?.label}
          </span>
        </div>
        <button onClick={generatePDF}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
          PDF İndir
        </button>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="space-y-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[#444] text-xs uppercase tracking-wide mb-3">Müşteri</p>
            <p className="text-white font-medium text-sm">{order.customers?.full_name}</p>
            <p className="text-[#666] text-xs mt-1">{order.customers?.phone}</p>
            <p className="text-[#555] text-xs">{order.customers?.email}</p>
            <p className="text-[#555] text-xs">{order.customers?.address}</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[#444] text-xs uppercase tracking-wide mb-3">Cihaz</p>
            <p className="text-white font-medium text-sm">{order.devices?.brand} {order.devices?.model}</p>
            <p className="text-[#666] text-xs mt-1">Seri: {order.devices?.serial_number ?? '—'}</p>
            <p className="text-[#555] text-xs">Teknisyen: {order.technicians?.full_name ?? '—'}</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[#444] text-xs uppercase tracking-wide mb-2">Sorun</p>
            <p className="text-[#aaa] text-sm">{order.problem_description}</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4 space-y-3">
            <p className="text-[#444] text-xs uppercase tracking-wide">Durum Güncelle</p>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              {Object.entries(STATUS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <textarea
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="Teşhis notları..."
              rows={3}
              className={inputCls + ' resize-none'}
            />
            <button onClick={updateOrder}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition">
              Kaydet
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[#444] text-xs uppercase tracking-wide mb-4">Maliyet Kalemleri</p>

            <div className="grid grid-cols-12 gap-2 mb-4">
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Açıklama" className={inputCls + ' col-span-4'} />
              <input value={newQty} onChange={e => setNewQty(e.target.value)}
                placeholder="Adet" type="number" min="0.01" step="0.01"
                className={inputCls + ' col-span-2'} />
              <input value={newPrice} onChange={e => setNewPrice(e.target.value)}
                placeholder="Fiyat" type="number" min="0" step="0.01"
                className={inputCls + ' col-span-3'} />
              <input value={newDiscount} onChange={e => setNewDiscount(e.target.value)}
                placeholder="İndirim%" type="number" min="0" max="100"
                className={inputCls + ' col-span-2'} />
              <button onClick={addItem} disabled={saving}
                className="col-span-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition disabled:opacity-50">
                +
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-[#444] text-xs text-center py-6">Henüz kalem eklenmedi</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 text-[#444] font-medium">Açıklama</th>
                    <th className="text-right py-2 text-[#444] font-medium">Adet</th>
                    <th className="text-right py-2 text-[#444] font-medium">Fiyat</th>
                    <th className="text-right py-2 text-[#444] font-medium">İndirim</th>
                    <th className="text-right py-2 text-[#444] font-medium">Toplam</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const line = item.quantity * item.unit_price
                    const total = line - line * (item.discount_percent / 100)
                    return (
                      <tr key={item.id} className="border-b border-white/[0.04] last:border-0">
                        <td className="py-2.5 text-[#ccc]">{item.description}</td>
                        <td className="py-2.5 text-right text-[#888]">{item.quantity}</td>
                        <td className="py-2.5 text-right text-[#888]">{item.unit_price.toFixed(2)} TL</td>
                        <td className="py-2.5 text-right text-[#555]">%{item.discount_percent}</td>
                        <td className="py-2.5 text-right text-white font-medium">{total.toFixed(2)} TL</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => removeItem(item.id)}
                            className="text-[#333] hover:text-red-400 transition text-xs">Sil</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/10">
                    <td colSpan={4} className="pt-3 text-right text-[#666] font-medium">Genel Toplam</td>
                    <td className="pt-3 text-right text-white font-medium text-sm">{calcTotal().toFixed(2)} TL</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}