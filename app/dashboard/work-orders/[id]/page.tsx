'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'
import { useSettings } from '@/app/hooks/useSettings'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as QRCode from 'qrcode'

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
  beklemede:       { label: 'Beklemede',       cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  incelemede:      { label: 'Incelemede',      cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  onay_bekleniyor: { label: 'Onay Bekleniyor', cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  tamirde:         { label: 'Tamirde',         cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  tamamlandi:      { label: 'Tamamlandi',      cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
  teslim_edildi:   { label: 'Teslim Edildi',   cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  iptal:           { label: 'Iptal',           cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [220, 38, 38]
  return [r, g, b]
}

function tr(str: string): string {
  return (str ?? '').toString()
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
}

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()
  const d = theme === 'dark'
  const s = useSettings()

  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [items, setItems] = useState<WorkOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [parts, setParts] = useState<{id: string; name: string; list_price: number}[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newPrice, setNewPrice] = useState('')
  const [newDiscount, setNewDiscount] = useState('0')
  const [saving, setSaving] = useState(false)

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#111] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`
  const cardCls = `rounded-xl border p-4 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`

  useEffect(() => {
    fetchOrder()
    fetchPhotos()
    supabase.from('parts').select('id, name, list_price').eq('is_active', true).order('name').then(({ data }) => setParts(data ?? []))
  }, [])

  async function fetchOrder() {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, order_number, status, problem_description, diagnosis, created_at,
        customers:customer_id(full_name, phone, email, address),
        devices:device_id(brand, model, serial_number),
        technicians:technician_id(full_name),
        work_order_items(id, description, quantity, unit_price, discount_percent)
      `)
      .eq('id', id)
      .single()

    if (data) {
      const wo = data as unknown as WorkOrder
      setOrder(wo)
      setItems(wo.work_order_items ?? [])
      setStatus(wo.status)
      setDiagnosis(wo.diagnosis ?? '')
    }
    setLoading(false)
  }

  async function fetchPhotos() {
    const { data } = await supabase.storage.from('work-order-photos').list(`${id}`)
    if (data) {
      const urls = data.map(file => {
        const { data: urlData } = supabase.storage.from('work-order-photos').getPublicUrl(`${id}/${file.name}`)
        return urlData.publicUrl
      })
      setPhotos(urls)
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingPhoto(true)
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      await supabase.storage.from('work-order-photos').upload(`${id}/${fileName}`, file)
    }
    await fetchPhotos()
    setUploadingPhoto(false)
    e.target.value = ''
  }

  async function deletePhoto(url: string) {
    const path = url.split('/work-order-photos/')[1]
    await supabase.storage.from('work-order-photos').remove([path])
    await fetchPhotos()
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
    if (order?.customers?.email) {
      const statusMessages: Record<string, string> = {
        incelemede:      'Cihaziniz teknik servisimize ulasti ve inceleme surecine alindi.',
        onay_bekleniyor: 'Cihaziniz incelendi. Tamir islemi icin onayinizi bekliyoruz.',
        tamirde:         'Cihazinizin tamir islemi basladi.',
        tamamlandi:      'Cihazinizin tamiri tamamlandi. Teslim almak icin bizi arayabilirsiniz.',
        teslim_edildi:   'Cihaziniz teslim edilmistir. Bizi tercih ettiginiz icin tesekkur ederiz.',
        iptal:           'Is emiriniz iptal edilmistir.',
      }
      if (statusMessages[status]) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: order.customers.email,
            customerName: order.customers.full_name,
            orderNumber: order.order_number,
            status,
            deviceName: order.devices ? `${order.devices.brand} ${order.devices.model}` : '',
            message: statusMessages[status],
          }),
        })
      }
    }
    alert('Kaydedildi!')
  }

  async function deleteOrder() {
    if (!confirm(`#${order?.order_number} numarali is emrini silmek istediginize emin misiniz?`)) return
    await supabase.from('work_order_items').delete().eq('work_order_id', id)
    await supabase.from('work_orders').delete().eq('id', id)
    router.replace('/dashboard/work-orders')
  }

  function sendWhatsApp(message: string) {
    if (!order?.customers?.phone) { alert('Musteri telefon numarasi bulunamadi!'); return }
    const phone = order.customers.phone.replace(/\D/g, '')
    const finalPhone = phone.startsWith('0') ? '90' + phone.slice(1) : '90' + phone
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  function whatsAppMesaj(tip: string) {
    if (!order) return
    const cihaz = order.devices ? `${order.devices.brand} ${order.devices.model}` : 'cihaziniz'
    const takipLink = `${window.location.origin}/takip`
    const mesajlar: Record<string, string> = {
      olusturuldu:   `Merhaba ${order.customers?.full_name}, is emiriniz olusturuldu. Is emri no: #${order.order_number}. Cihaziniz (${cihaz}) en kisa surede incelenecektir. Takip: ${takipLink}`,
      tamamlandi:    `Merhaba ${order.customers?.full_name}, ${cihaz} cihazinizin tamiri tamamlandi! Is emri no: #${order.order_number}. Teslim almak icin bizi arayabilirsiniz. Takip: ${takipLink}`,
      teslim_edildi: `Merhaba ${order.customers?.full_name}, ${cihaz} cihaziniz teslim edilmistir. Bizi tercih ettiginiz icin tesekkur ederiz. Iyi gunler dileriz!`,
    }
    sendWhatsApp(mesajlar[tip])
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
    const pdfRenk = hexToRgb(s.pdf_renk || '#dc2626')

    const logoSrc = s.logo_url || '/logo.png'
    const logoImg = new window.Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.src = logoSrc

    await new Promise<void>((resolve) => {
      logoImg.onload = () => resolve()
      logoImg.onerror = () => resolve()
      setTimeout(resolve, 3000)
    })

    const canvas = document.createElement('canvas')
    canvas.width = logoImg.naturalWidth || 400
    canvas.height = logoImg.naturalHeight || 200
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(logoImg, 0, 0)
    const logoData = canvas.toDataURL('image/png')

    const doc = new jsPDF()

    const maxW = 55
    const maxH = 25
    const ratio = Math.min(maxW / (logoImg.naturalWidth || 400), maxH / (logoImg.naturalHeight || 200))
    const logoW = (logoImg.naturalWidth || 400) * ratio
    const logoH = (logoImg.naturalHeight || 200) * ratio
    doc.addImage(logoData, 'PNG', 10, 8, logoW, logoH)

    doc.setTextColor(...koyu)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text(`Is Emri #${order.order_number}`, 196, 14, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Tarih: ${new Date(order.created_at).toLocaleDateString('tr-TR')}`, 196, 22, { align: 'right' })
    doc.text(`Durum: ${tr(STATUS[order.status]?.label ?? order.status)}`, 196, 29, { align: 'right' })

    doc.setDrawColor(...pdfRenk)
    doc.setLineWidth(0.8)
    doc.line(10, 38, 200, 38)

    const rowY = 46
    doc.setFillColor(...acik)
    doc.roundedRect(10, rowY, 88, 40, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('MUSTERI', 14, rowY + 6)
    doc.setTextColor(...koyu)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(tr(order.customers?.full_name ?? ''), 14, rowY + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(tr(order.customers?.phone ?? ''), 14, rowY + 20)
    doc.text(tr(order.customers?.email ?? ''), 14, rowY + 26)
    doc.text(tr(order.customers?.address ?? ''), 14, rowY + 32, { maxWidth: 80 })

    doc.setFillColor(...acik)
    doc.roundedRect(104, rowY, 88, 40, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('CIHAZ', 108, rowY + 6)
    doc.setTextColor(...koyu)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(tr(`${order.devices?.brand ?? ''} ${order.devices?.model ?? ''}`), 108, rowY + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(tr(`Seri No: ${order.devices?.serial_number ?? '-'}`), 108, rowY + 20)
    doc.text(tr(`Teknisyen: ${order.technicians?.full_name ?? '-'}`), 108, rowY + 26)

    let curY = rowY + 48
    doc.setFillColor(...acik)
    doc.roundedRect(10, curY, 182, 16, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('SORUN', 14, curY + 6)
    doc.setTextColor(...koyu)
    doc.setFontSize(9)
    doc.text(tr(order.problem_description ?? ''), 14, curY + 12, { maxWidth: 174 })

    if (order.diagnosis) {
      curY += 22
      doc.setFillColor(...acik)
      doc.roundedRect(10, curY, 182, 16, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text('TESHIS', 14, curY + 6)
      doc.setTextColor(...koyu)
      doc.setFontSize(9)
      doc.text(tr(order.diagnosis), 14, curY + 12, { maxWidth: 174 })
    }

    curY += 26
    autoTable(doc, {
      startY: curY,
      head: [['ACIKLAMA', 'ADET', 'BIRIM FIYAT', 'INDIRIM', 'TOPLAM']],
      body: items.map(item => {
        const line = item.quantity * item.unit_price
        const total = line - line * (item.discount_percent / 100)
        return [
          tr(item.description),
          item.quantity.toString(),
          item.unit_price.toFixed(2) + ' TL',
          item.discount_percent > 0 ? '%' + item.discount_percent : '-',
          total.toFixed(2) + ' TL',
        ]
      }),
      foot: [['', '', '', 'GENEL TOPLAM', calcTotal().toFixed(2) + ' TL']],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: pdfRenk, textColor: 255, fontStyle: 'bold', fontSize: 8 },
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
    doc.setDrawColor(...pdfRenk)
    doc.setLineWidth(0.8)
    doc.line(10, pageH - 18, 200, pageH - 18)
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.text(
      tr(`${s.firma_adi} · Tel: ${s.firma_telefon} · ${s.firma_email}`),
      105, pageH - 11, { align: 'center' }
    )
    doc.text(
      tr(`${s.firma_adres} · ${s.firma_web}`),
      105, pageH - 5, { align: 'center' }
    )
// QR Kod — sağ üst, iş emri bilgilerinin altına
    const takipUrl = `${window.location.origin}/takip`
    const qrDataUrl = await QRCode.toDataURL(takipUrl, {
      width: 80,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
    const qrSize = 20
    const qrX = 196 - qrSize
    const qrY = 34
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    doc.text('Takip icin okutun', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' })

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <p className={d ? 'text-[#333]' : 'text-gray-400'}>Yukleniyor...</p>
    </div>
  )

  if (!order) return (
    <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <p className={d ? 'text-[#333]' : 'text-gray-400'}>Is emri bulunamadi.</p>
    </div>
  )

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />

      <div className={`px-4 sm:px-6 py-4 flex items-center justify-between border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className={`text-sm transition ${d ? 'text-[#555] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>← Geri</button>
          <span className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>İş Emri #{order.order_number}</span>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS[order.status]?.cls}`}>
            {STATUS[order.status]?.label}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={generatePDF}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
            PDF İndir
          </button>
          <button onClick={deleteOrder}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs px-3 py-1.5 rounded-lg transition">
            Sil
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="space-y-4">

          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Müşteri</p>
            <p className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{order.customers?.full_name}</p>
            <p className={`text-xs mt-1 ${d ? 'text-[#666]' : 'text-gray-500'}`}>{order.customers?.phone}</p>
            <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{order.customers?.email}</p>
            <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{order.customers?.address}</p>

            {order.customers?.phone && (
              <div className="mt-3 space-y-1.5">
                <p className={`text-[10px] uppercase tracking-wide mb-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>WhatsApp Gönder</p>
                {[
                  { tip: 'olusturuldu', label: 'İş emri oluşturuldu' },
                  { tip: 'tamamlandi', label: 'Tamir tamamlandı' },
                  { tip: 'teslim_edildi', label: 'Cihaz teslim edildi' },
                ].map(({ tip, label }) => (
                  <button key={tip} onClick={() => whatsAppMesaj(tip)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition border"
                    style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366', borderColor: 'rgba(37,211,102,0.2)' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-3 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Cihaz</p>
            <p className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{order.devices?.brand} {order.devices?.model}</p>
            <p className={`text-xs mt-1 ${d ? 'text-[#666]' : 'text-gray-500'}`}>Seri: {order.devices?.serial_number ?? '—'}</p>
            <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>Teknisyen: {order.technicians?.full_name ?? '—'}</p>
          </div>

          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Sorun</p>
            <p className={`text-sm ${d ? 'text-[#aaa]' : 'text-gray-600'}`}>{order.problem_description}</p>
          </div>

          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs uppercase tracking-wide ${d ? 'text-[#444]' : 'text-gray-400'}`}>Fotoğraflar</p>
              <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition cursor-pointer">
                {uploadingPhoto ? 'Yükleniyor...' : '+ Ekle'}
                <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={uploadPhoto} disabled={uploadingPhoto} />
              </label>
            </div>
            {photos.length === 0 ? (
              <p className={`text-xs text-center py-4 ${d ? 'text-[#333]' : 'text-gray-300'}`}>Henüz fotoğraf yok</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`foto-${i}`} className="w-full h-20 object-cover rounded-lg cursor-pointer" onClick={() => setLightbox(url)} />
                    <button onClick={() => deletePhoto(url)}
                      className="absolute top-1 right-1 bg-black/70 text-red-400 text-xs w-5 h-5 rounded-full items-center justify-center hidden group-hover:flex">
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={cardCls + ' space-y-3'}>
            <p className={`text-xs uppercase tracking-wide ${d ? 'text-[#444]' : 'text-gray-400'}`}>Durum Güncelle</p>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              {Object.entries(STATUS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
              placeholder="Teşhis notları..." rows={3} className={inputCls + ' resize-none'} />
            <button onClick={updateOrder}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg transition">
              Kaydet
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-4 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Maliyet Kalemleri</p>

            <div className="space-y-2 mb-4">
              <select onChange={e => {
                const part = parts.find(p => p.id === e.target.value)
                if (part) { setNewDesc(part.name); setNewPrice(part.list_price.toString()) }
              }} className={inputCls} defaultValue="">
                <option value="">Stoktan seç...</option>
                {parts.map(p => <option key={p.id} value={p.id}>{p.name} — {p.list_price.toFixed(2)} TL</option>)}
              </select>
              <div className="grid grid-cols-12 gap-2">
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Açıklama" className={inputCls + ' col-span-4'} />
                <input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Adet" type="number" min="0.01" step="0.01" className={inputCls + ' col-span-2'} />
                <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Fiyat" type="number" min="0" step="0.01" className={inputCls + ' col-span-3'} />
                <input value={newDiscount} onChange={e => setNewDiscount(e.target.value)} placeholder="İndirim%" type="number" min="0" max="100" className={inputCls + ' col-span-2'} />
                <button onClick={addItem} disabled={saving}
                  className="col-span-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition disabled:opacity-50">
                  +
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className={`text-xs text-center py-6 ${d ? 'text-[#444]' : 'text-gray-300'}`}>Henüz kalem eklenmedi</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                    {['Açıklama', 'Adet', 'Fiyat', 'İndirim', 'Toplam', ''].map(h => (
                      <th key={h} className={`py-2 font-medium text-left last:text-right ${d ? 'text-[#444]' : 'text-gray-400'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const line = item.quantity * item.unit_price
                    const total = line - line * (item.discount_percent / 100)
                    return (
                      <tr key={item.id} className={`border-b last:border-0 ${d ? 'border-white/[0.04]' : 'border-gray-50'}`}>
                        <td className={`py-2.5 ${d ? 'text-[#ccc]' : 'text-gray-700'}`}>{item.description}</td>
                        <td className={`py-2.5 text-right ${d ? 'text-[#888]' : 'text-gray-500'}`}>{item.quantity}</td>
                        <td className={`py-2.5 text-right ${d ? 'text-[#888]' : 'text-gray-500'}`}>{item.unit_price.toFixed(2)} TL</td>
                        <td className={`py-2.5 text-right ${d ? 'text-[#555]' : 'text-gray-400'}`}>%{item.discount_percent}</td>
                        <td className={`py-2.5 text-right font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{total.toFixed(2)} TL</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500 transition text-xs">Sil</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 ${d ? 'border-white/10' : 'border-gray-200'}`}>
                    <td colSpan={4} className={`pt-3 text-right font-medium ${d ? 'text-[#666]' : 'text-gray-500'}`}>Genel Toplam</td>
                    <td className={`pt-3 text-right font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{calcTotal().toFixed(2)} TL</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="foto" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  )
}