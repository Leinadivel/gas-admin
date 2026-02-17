'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const nav = [
  { href: '/vendor/dashboard', label: 'Dashboard' },
  { href: '/vendor/drivers', label: 'Drivers' },
  { href: '/vendor/vehicles', label: 'Vehicles' },
  { href: '/vendor/bookings', label: 'Bookings' },
  { href: '/vendor/wallet', label: 'Wallet' },
  { href: '/vendor/documents', label: 'Documents' },
]

export default function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // No sidebar/header on vendor auth pages
  const isVendorAuth =
    pathname === '/vendor/login' ||
    pathname.startsWith('/vendor/login/') ||
    pathname === '/vendor/register' ||
    pathname.startsWith('/vendor/register/')

  const onSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/vendor/login')
  }

  if (isVendorAuth) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white">
        <div className="px-4 py-4 border-b">
          <div className="text-lg font-semibold">Vendor Portal</div>
          <div className="text-xs opacity-60">Manage drivers, vehicles, orders</div>
        </div>

        <nav className="p-3 space-y-1 text-sm">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'block rounded-md px-3 py-2 transition-colors',
                  active ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-700',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="h-14 border-b bg-white flex items-center justify-between px-4">
          <div className="text-sm font-medium">Vendor</div>
          <button
            onClick={onSignOut}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
