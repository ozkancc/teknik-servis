'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/app/context/ThemeContext'

type Settings = {
  id: string
  firma_adi: string
  firma_telefon: string
  firma_email: string
  firma_adres: string
  firma_web: string
  firma_slogan: string
  pdf_renk: string
  logo_url: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { theme } = useTheme()
  const d = theme === 'dark'

  const inputCls = `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${d ? 'bg-[#111] border-white/[0.08] text-white placeholder-[#444]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`
  const cardCls = `rounded-xl border p-5 ${d ? 'bg-[#1a1a1a] border-white/[0.06]' : 'bg-white border-gray-100'}`
  const labelCls = `block text-xs font-medium mb-1.5 ${d ? 'text-[#888]' : 'text-gray-500'}`

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) setSettings(data as Settings)
    setLoading(false)
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    await supabase.from('settings').update({
      firma_adi: settings.firma_adi,
      firma_telefon: settings.firma_telefon,
      firma_email: settings.firma_email,
      firma_adres: settings.firma_adres,
      firma_web: settings.firma_web,
      firma_slogan: settings.firma_slogan,
      pdf_renk: settings.pdf_renk,
      updated_at: new Date().toISOString(),
    }).eq('id', settings.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !settings) return
    setUploadingLogo(true)

    const ext = file.name.split('.').pop()
    const fileName = `logo.${ext}`

    await supabase.storage.from('work-order-photos').upload(`settings/${fileName}`, file, { upsert: true })

    const { data: urlData } = supabase.storage
      .from('work-order-photos')
      .getPublicUrl(`settings/${fileName}`)

    await supabase.from('settings').update({ logo_url: urlData.publicUrl }).eq('id', settings.id)
    setSettings({ ...settings, logo_url: urlData.publicUrl })
    setUploadingLogo(false)
  }

  function update(key: keyof Settings, value: string) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <p className={d ? 'text-[#333]' : 'text-gray-400'}>Yükleniyor...</p>
    </div>
  )

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}>Ayarlar</h2>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>

        <div className="space-y-4">

          {/* Logo */}
          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-4 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Logo</p>
            <div className="flex items-center gap-4">
              <div className={`w-32 h-20 rounded-lg border flex items-center justify-center overflow-hidden ${d ? 'bg-[#111] border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <p className={`text-xs ${d ? 'text-[#333]' : 'text-gray-300'}`}>Logo yok</p>
                )}
              </div>
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className={`text-xs px-4 py-2 rounded-lg border transition ${d ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  {uploadingLogo ? 'Yükleniyor...' : 'Logo Değiştir'}
                </button>
                <p className={`text-xs mt-2 ${d ? 'text-[#444]' : 'text-gray-400'}`}>PNG veya JPG, max 2MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              </div>
            </div>
          </div>

          {/* Firma Bilgileri */}
          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-4 ${d ? 'text-[#444]' : 'text-gray-400'}`}>Firma Bilgileri</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Firma Adı</label>
                <input value={settings?.firma_adi ?? ''} onChange={e => update('firma_adi', e.target.value)} className={inputCls} placeholder="Gen Teknik Servis" />
              </div>
              <div>
                <label className={labelCls}>Slogan</label>
                <input value={settings?.firma_slogan ?? ''} onChange={e => update('firma_slogan', e.target.value)} className={inputCls} placeholder="Bilgisayar - Telefon - Tablet" />
              </div>
              <div>
                <label className={labelCls}>Telefon</label>
                <input value={settings?.firma_telefon ?? ''} onChange={e => update('firma_telefon', e.target.value)} className={inputCls} placeholder="0532 123 4567" />
              </div>
              <div>
                <label className={labelCls}>E-posta</label>
                <input value={settings?.firma_email ?? ''} onChange={e => update('firma_email', e.target.value)} className={inputCls} placeholder="info@firma.com" type="email" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Adres</label>
                <input value={settings?.firma_adres ?? ''} onChange={e => update('firma_adres', e.target.value)} className={inputCls} placeholder="İlçe, Şehir" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Web Sitesi</label>
                <input value={settings?.firma_web ?? ''} onChange={e => update('firma_web', e.target.value)} className={inputCls} placeholder="www.firma.com" />
              </div>
            </div>
          </div>

          {/* PDF Ayarları */}
          <div className={cardCls}>
            <p className={`text-xs uppercase tracking-wide mb-4 ${d ? 'text-[#444]' : 'text-gray-400'}`}>PDF Özelleştirme</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>PDF Tema Rengi</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings?.pdf_renk ?? '#dc2626'}
                    onChange={e => update('pdf_renk', e.target.value)}
                    className="w-12 h-10 rounded-lg border cursor-pointer"
                    style={{ borderColor: d ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}
                  />
                  <input
                    value={settings?.pdf_renk ?? '#dc2626'}
                    onChange={e => update('pdf_renk', e.target.value)}
                    className={inputCls}
                    placeholder="#dc2626"
                    style={{ maxWidth: '140px' }}
                  />
                  <div className="flex gap-2">
                    {['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0f172a'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => update('pdf_renk', color)}
                        className="w-7 h-7 rounded-full border-2 transition"
                        style={{
                          background: color,
                          borderColor: settings?.pdf_renk === color ? '#fff' : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* PDF önizleme */}
              <div>
                <label className={labelCls}>PDF Önizleme</label>
                <div className={`rounded-lg border p-4 ${d ? 'bg-[#111] border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="rounded overflow-hidden" style={{ maxWidth: '300px' }}>
                    <div className="p-3 flex items-center justify-between" style={{ borderBottom: `3px solid ${settings?.pdf_renk ?? '#dc2626'}` }}>
                      {settings?.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="h-8 object-contain" />
                      ) : (
                        <p className={`text-xs font-bold ${d ? 'text-white' : 'text-gray-900'}`}>{settings?.firma_adi}</p>
                      )}
                      <div className="text-right">
                        <p className={`text-xs font-bold ${d ? 'text-white' : 'text-gray-900'}`}>İş Emri #123</p>
                        <p className={`text-[10px] ${d ? 'text-[#555]' : 'text-gray-400'}`}>01.01.2026</p>
                      </div>
                    </div>
                    <div className="p-2" style={{ background: settings?.pdf_renk ?? '#dc2626' }}>
                      <div className="flex justify-between">
                        <p className="text-white text-[10px] font-bold">ACIKLAMA</p>
                        <p className="text-white text-[10px] font-bold">TOPLAM</p>
                      </div>
                    </div>
                    <div className={`p-2 border-t ${d ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                      <div className="flex justify-between">
                        <p className={`text-[10px] ${d ? 'text-[#888]' : 'text-gray-500'}`}>240 GB SSD</p>
                        <p className={`text-[10px] font-bold ${d ? 'text-white' : 'text-gray-900'}`}>1800 TL</p>
                      </div>
                    </div>
                    <div className="p-2 text-center" style={{ borderTop: `2px solid ${settings?.pdf_renk ?? '#dc2626'}` }}>
                      <p className={`text-[9px] ${d ? 'text-[#444]' : 'text-gray-400'}`}>{settings?.firma_adi} · {settings?.firma_telefon}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kaydet butonu alt */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Ayarları Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}