import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Settings = {
  firma_adi: string
  firma_telefon: string
  firma_email: string
  firma_adres: string
  firma_web: string
  firma_slogan: string
  pdf_renk: string
  logo_url: string
}

const defaultSettings: Settings = {
  firma_adi: process.env.NEXT_PUBLIC_FIRMA_ADI ?? 'Teknik Servis',
  firma_telefon: process.env.NEXT_PUBLIC_FIRMA_TELEFON ?? '',
  firma_email: process.env.NEXT_PUBLIC_FIRMA_EMAIL ?? '',
  firma_adres: process.env.NEXT_PUBLIC_FIRMA_ADRES ?? '',
  firma_web: process.env.NEXT_PUBLIC_FIRMA_WEB ?? '',
  firma_slogan: '',
  pdf_renk: '#dc2626',
  logo_url: '/logo.png',
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) setSettings(data as Settings)
    })
  }, [])

  return settings
}