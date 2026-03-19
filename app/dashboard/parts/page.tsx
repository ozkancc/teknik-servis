'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'

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
  const { theme } = useTheme()
  const d = theme === 'dark'

  useEffect(() => { fetchParts() }, [])

  async function fetchParts() {
    const { data } = await supabase.from('parts').select('*').order('name')
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
      name, description, unit,
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

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#111] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>Stok & Parçalar</h2>
          <button onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
            + Yeni Parça
          </button>
        </div>

        {showForm && (
          <div className={`rounded-xl border p-4 mb-4 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
            <p className={`text-xs font-medium mb-3 ${d ? 'text-white' : 'text-gray-900'}`}>
              {editingId ? 'Parçayı Düzenle' : 'Yeni Parça Ekle'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Parça adı *" className={inputCls} />
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama" className={inputCls} />
              <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls}>
                <option value="adet">Adet</option>
                <option value="metre">Metre</option>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
                <option value="paket">Paket</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Liste fiyatı (TL)" type="number" className={inputCls} />
              <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stok miktarı" type="number" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={savePart} disabled={saving || !name}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button onClick={() => setShowForm(false)}
                className={`text-xs px-4 py-2 rounded-lg transition ${d ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                İptal
              </button>
            </div>
          </div>
        )}

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Parça ara..."
          className={inputCls + ' mb-4'}
        />

        {parts.filter(p => p.stock_quantity <= 3 && p.is_active).length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
            <p className="text-yellow-500 text-xs font-medium">
              Düşük Stok — {parts.filter(p => p.stock_quantity <= 3 && p.is_active).map(p => p.name).join(', ')}
            </p>
          </div>
        )}

        {loading ? (
          <p className={`text-sm ${d ? 'text-[#444]' : 'text-gray-400'}`}>Yükleniyor...</p>
        ) : (
          <>
            <div className={`hidden sm:block rounded-xl border overflow-hidden ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                    {['Parça Adı', 'Açıklama', 'Birim', 'Liste Fiyatı', 'Stok', 'Durum', ''].map(h => (
                      <th key={h} className={`text-left px-4 py-3 font-medium ${d ? 'text-[#444]' : 'text-gray-400'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className={`border-b last:border-0 transition ${d ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 font-medium ${d ? 'text-white' : 'text-gray-900'}`}>{p.name}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#666]' : 'text-gray-400'}`}>{p.description ?? '—'}</td>
                      <td className={`px-4 py-3 ${d ? 'text-[#666]' : 'text-gray-400'}`}>{p.unit}</td>
                      <td className={`px-4 py-3 text-right ${d ? 'text-[#888]' : 'text-gray-500'}`}>{p.list_price?.toFixed(2)} TL</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateStock(p.id, -1)}
                            className={`w-5 h-5 flex items-center justify-center rounded transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-300 hover:text-gray-700'}`}>−</button>
                          <span className={`font-medium min-w-[24px] text-center ${
                            p.stock_quantity === 0 ? 'text-red-500' :
                            p.stock_quantity <= 3 ? 'text-yellow-500' :
                            d ? 'text-white' : 'text-gray-900'
                          }`}>{p.stock_quantity}</span>
                          <button onClick={() => updateStock(p.id, 1)}
                            className={`w-5 h-5 flex items-center justify-center rounded transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-300 hover:text-gray-700'}`}>+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          p.is_active
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        }`}>
                          {p.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openForm(p)}
                            className={`text-xs transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>Düzenle</button>
                          <button onClick={() => toggleActive(p.id, p.is_active)}
                            className={`text-xs transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                            {p.is_active ? 'Pasife al' : 'Aktife al'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-2">
              {filtered.map(p => (
                <div key={p.id} className={`rounded-xl border p-4 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className={`font-medium text-sm ${d ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-xs ${d ? 'text-[#555]' : 'text-gray-400'}`}>{p.description ?? ''}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      p.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {p.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${d ? 'text-[#888]' : 'text-gray-400'}`}>{p.list_price?.toFixed(2)} TL / {p.unit}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateStock(p.id, -1)} className={d ? 'text-[#444] hover:text-white' : 'text-gray-300 hover:text-gray-700'}>−</button>
                      <span className={`font-medium text-sm ${
                        p.stock_quantity === 0 ? 'text-red-500' :
                        p.stock_quantity <= 3 ? 'text-yellow-500' :
                        d ? 'text-white' : 'text-gray-900'
                      }`}>{p.stock_quantity}</span>
                      <button onClick={() => updateStock(p.id, 1)} className={d ? 'text-[#444] hover:text-white' : 'text-gray-300 hover:text-gray-700'}>+</button>
                    </div>
                  </div>
                  <button onClick={() => openForm(p)}
                    className={`text-xs mt-2 transition ${d ? 'text-[#444] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>Düzenle</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}