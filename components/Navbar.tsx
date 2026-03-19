'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useTheme } from '@/app/context/ThemeContext'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Ana Sayfa' },
    { href: '/dashboard/work-orders', label: 'İş Emirleri' },
    { href: '/dashboard/customers', label: 'Müşteriler' },
    { href: '/dashboard/technicians', label: 'Teknisyenler' },
    { href: '/dashboard/parts', label: 'Stok' },
    { href: '/dashboard/export', label: 'Dışa Aktar' },
  ]

  const isDark = theme === 'dark'

  return (
    <nav className={`${isDark ? 'bg-[#1a1a1a] border-white/[0.08]' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
  <Image src="/logo.png" alt="Gen Teknik Servis" width={110} height={34} className="object-contain cursor-pointer" />
</Link>
          <div className="hidden sm:flex gap-0.5">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === link.href
                    ? isDark
                      ? 'text-white bg-white/10'
                      : 'text-gray-900 bg-gray-100'
                    : isDark
                      ? 'text-[#666] hover:text-white hover:bg-white/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tema toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#666] hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title={isDark ? 'Aydınlık tema' : 'Koyu tema'}
          >
            {isDark ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`hidden sm:block text-xs transition-colors ${isDark ? 'text-[#555] hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
          >
            Çıkış
          </button>

          {/* Mobil hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`sm:hidden p-1 ${isDark ? 'text-[#666] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen
                ? <path strokeLinecap="round" d="M4 4l12 12M4 16L16 4"/>
                : <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobil menü */}
      {menuOpen && (
        <div className={`sm:hidden border-t py-2 px-4 space-y-0.5 ${isDark ? 'border-white/[0.08]' : 'border-gray-100'}`}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm px-3 py-2.5 rounded-lg transition-colors ${
                pathname === link.href
                  ? isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'
                  : isDark ? 'text-[#666] hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="block w-full text-left text-sm px-3 py-2.5 text-red-400 hover:bg-white/5 rounded-lg"
          >
            Çıkış
          </button>
        </div>
      )}
    </nav>
  )
}