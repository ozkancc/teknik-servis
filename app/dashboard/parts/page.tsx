'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Part = {
  id: string
  name: string
  description: string
  unit: string
  list_price: number
  stock_quantity: number
  is_active: boolean
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('adet')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const inputCls = "w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-blue-500"

  useEffect(() => { fetchParts() }, [])

  async function fetchParts() {
    const { data } = await supabase
      .from('parts')
      .select('*')
      .order('name')
    setParts(data ?? [])
    setLoading(false)
  }

  function openForm(part?: Part) {
    if (part) {
      setEditingId(part.id)
      setName(part.name)
      setDescription(part.description ?? '')
      setUnit(part.unit ?? 'adet')
      setPrice(part.list_price?.toString() ?? '')
      setStock(part.stock_quantity?.toString() ?? '')
    } else {
      setEditingId(null)
      setName(''); setDescription(''); setUnit('adet'); setPrice(''); setStock('')
    }
    setShowForm(true)
  }

  async function savePart() {
    if (!name) return
    setSaving(true)
    const payload = {
      name,
      description,
      unit,
      list_price: parseFloat(price) || 0,
      stock_quantity: parseInt(stock) || 0,
    }

    if (editingId) {
      await supabase.from('parts').update(payload).eq('id', editingId)
    } else {
      await supabase.from('parts').insert(payload)
    }

    setShowForm(false)
    setEditingId(null)
    await fetchParts()
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('parts').update({ is_active: !current }).eq('id', id)
    await fetchParts()
  }

  async function updateStock(id: string, delta: number) {
    const part = parts.find(p => p.id === id)
    if (!part) return
    const newQty = Math.max(0, part.stock_quantity + delta)
    await supabase.from('parts').update({ stock_quantity: newQty }).eq('id', id)
    await fetchParts()
  }

  const filtered = parts.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-medium">Stok & Parçalar</h2>
          <button
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
          >
            + Yeni Parça
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-4 mb-4">
            <p className="text-white text-xs font-medium mb-3">
              {editingId ? 'Parçayı Düzenle' : 'Yeni Parça Ekle'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Parça adı *" className={inputCls} />
              <input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Açıklama" className={inputCls} />
              <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls}>
                <option value="adet">Adet</option>
                <option value="metre">Metre</option>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
                <option value="paket">Paket</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input value={price} onChange={e => setPrice(e.target.value)}
                placeholder="Liste fiyatı (TL)" type="number" min="0" step="0.01"
                className={inputCls} />
              <input value={stock} onChange={e => setStock(e.target.value)}
                placeholder="Stok miktarı" type="number" min="0"
                className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={savePart} disabled={saving || !name}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="bg-white/10 hover:bg-white/15 text-white text-xs px-4 py-2 rounded-lg transition">
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Arama */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Parça ara..."
          className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-4 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
        />

        {/* Stok uyarısı */}
        {parts.filter(p => p.stock_quantity <= 3 && p.is_active).length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
            <p className="text-yellow-400 text-xs font-medium">
              Düşük Stok Uyarısı — {parts.filter(p => p.stock_quantity <= 3 && p.is_active).length} parçanın stoğu azalıyor
            </p>
            <p className="text-yellow-500/70 text-xs mt-0.5">
              {parts.filter(p => p.stock_quantity <= 3 && p.is_active).map(p => p.name).join(', ')}
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-[#444] text-sm">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[#444] text-sm">
            {search ? 'Sonuç bulunamadı' : 'Henüz parça eklenmedi'}
          </div>
        ) : (
          <>
            {/* Masaüstü tablo */}
            <div className="hidden sm:block bg-[#1a1a1a] rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Parça Adı</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Açıklama</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Birim</th>
                    <th className="text-right px-4 py-3 text-[#444] font-medium">Liste Fiyatı</th>
                    <th className="text-center px-4 py-3 text-[#444] font-medium">Stok</th>
                    <th className="text-left px-4 py-3 text-[#444] font-medium">Durum</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-[#666]">{p.description ?? '—'}</td>
                      <td className="px-4 py-3 text-[#666]">{p.unit}</td>
                      <td className="px-4 py-3 text-right text-[#888]">{p.list_price?.toFixed(2)} TL</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateStock(p.id, -1)}
                            className="text-[#444] hover:text-white w-5 h-5 flex items-center justify-center rounded transition">−</button>
                          <span className={`font-medium min-w-[24px] text-center ${
                            p.stock_quantity === 0 ? 'text-red-400' :
                            p.stock_quantity <= 3 ? 'text-yellow-400' : 'text-white'
                          }`}>{p.stock_quantity}</span>
                          <button onClick={() => updateStock(p.id, 1)}
                            className="text-[#444] hover:text-white w-5 h-5 flex items-center justify-center rounded transition">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          p.is_active
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        }`}>
                          {p.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openForm(p)}
                            className="text-[#444] hover:text-white text-xs transition">Düzenle</button>
                          <button onClick={() => toggleActive(p.id, p.is_active)}
                            className="text-[#444] hover:text-white text-xs transition">
                            {p.is_active ? 'Pasife al' : 'Aktife al'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobil kartlar */}
            <div className="sm:hidden space-y-2">
              {filtered.map(p => (
                <div key={p.id} className="bg-[#1a1a1a] rounded-xl border border-white/[0.06] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-[#555] text-xs">{p.description ?? ''}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      p.is_active
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {p.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[#888] text-xs">{p.list_price?.toFixed(2)} TL / {p.unit}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateStock(p.id, -1)}
                        className="text-[#444] hover:text-white">−</button>
                      <span className={`font-medium text-sm ${
                        p.stock_quantity === 0 ? 'text-red-400' :
                        p.stock_quantity <= 3 ? 'text-yellow-400' : 'text-white'
                      }`}>{p.stock_quantity}</span>
                      <button onClick={() => updateStock(p.id, 1)}
                        className="text-[#444] hover:text-white">+</button>
                    </div>
                  </div>
                  <button onClick={() => openForm(p)}
                    className="text-[#444] hover:text-white text-xs mt-2 transition">Düzenle</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}