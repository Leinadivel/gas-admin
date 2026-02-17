'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

const mainItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profiles', label: 'Users' },
  { href: '/orders', label: 'Orders' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/transactions', label: 'Transactions' },
]

const settingsItems = [{ href: '/settings/pricing', label: 'Pricing' }]

export function SidebarNav() {
  const pathname = usePathname()

  const settingsActive = useMemo(() => {
    return settingsItems.some(
      (i) => pathname === i.href || pathname.startsWith(i.href + '/')
    )
  }, [pathname])

  const [settingsOpen, setSettingsOpen] = useState(settingsActive)

  return (
    <nav className="p-3 space-y-1 text-sm">
      {mainItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'block rounded-md px-3 py-2 transition-colors',
              active
                ? 'bg-gray-100 font-medium'
                : 'hover:bg-gray-50 text-gray-700',
            ].join(' ')}
          >
            {item.label}
          </Link>
        )
      })}

      {/* Settings dropdown */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className={[
            'w-full rounded-md px-3 py-2 text-left transition-colors',
            settingsActive
              ? 'bg-gray-100 font-medium'
              : 'hover:bg-gray-50 text-gray-700',
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <span>Settings</span>
            <span className="text-xs opacity-60">
              {settingsOpen ? '▾' : '▸'}
            </span>
          </div>
        </button>

        {settingsOpen ? (
          <div className="mt-1 space-y-1 pl-2">
            {settingsItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'block rounded-md px-3 py-2 transition-colors',
                    active
                      ? 'bg-gray-100 font-medium'
                      : 'hover:bg-gray-50 text-gray-700',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    </nav>
  )
}
