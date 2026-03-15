'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Ana Sayfa' },
    { href: '/dashboard/work-orders', label: 'İş Emirleri' },
    { href: '/dashboard/customers', label: 'Müşteriler' },
    { href: '/dashboard/technicians', label: 'Teknisyenler' },
  ]

  return (
    <nav className="bg-[#1a1a1a] border-b border-white/[0.08] sticky top-0 z-50">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Gen Teknik Servis" width={110} height={34} className="object-contain" />
          <div className="hidden sm:flex gap-0.5">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'text-white bg-white/10'
                    : 'text-[#666] hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs text-[#555] hover:text-red-400 transition-colors"
          >
            Çıkış
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-[#666] hover:text-white p-1"
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

      {menuOpen && (
        <div className="sm:hidden border-t border-white/[0.08] py-2 px-4 space-y-0.5">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm px-3 py-2.5 rounded-lg transition-colors ${
                pathname === link.href
                  ? 'text-white bg-white/10'
                  : 'text-[#666] hover:text-white hover:bg-white/5'
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