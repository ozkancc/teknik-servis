$content = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Sifreler eslesmiyor')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Hata: ' + error.message)
      setLoading(false)
      return
    }
    router.replace('/login')
  }

  if (!ready) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Baglanti dogrulanıyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="bg-[#141414] border border-white/10 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-xl font-semibold text-white mb-2">Yeni Sifre Belirle</h1>
        <p className="text-gray-500 text-sm mb-6">Yeni sifrenizi girin</p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Yeni Sifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="........"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Sifre Tekrar</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="........"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Sifreyi Guncelle'}
          </button>
        </form>
      </div>
    </div>
  )
}
'@
[System.IO.File]::WriteAllText("$PWD\app\reset-password\page.tsx", $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Dosya yazildi"