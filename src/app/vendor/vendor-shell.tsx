'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const nav = [
  { href: '/vendor/dashboard', label: 'Dashboard' },
  { href: '/vendor/drivers', label: 'Drivers' },
  { href: '/vendor/vehicles', label: 'Vehicles' },
  { href: '/vendor/bookings', label: 'Bookings' },
  { href: '/vendor/wallet', label: 'Wallet' },
  { href: '/vendor/documents', label: 'Documents' },
  { href: '/vendor/profile', label: 'Profile Settings' },
]

function VendorNav() {
  const pathname = usePathname()

  return (
    <nav className="p-2 sm:p-3 space-y-1 text-sm">
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
  )
}

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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
        <div className="border-b px-4 py-4">
          <div className="text-lg font-semibold">Vendor Portal</div>
          <div className="text-xs opacity-60">
            Manage drivers, vehicles, orders
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <VendorNav />
        </div>

        <div className="border-t p-3">
          <button
            onClick={onSignOut}
            className="w-full rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 border-b bg-white">
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile drawer trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open menu"
                  >
                    <span className="text-lg leading-none">☰</span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-[280px] p-0">
                  <div className="border-b px-4 py-4">
                    <div className="text-lg font-semibold">Vendor Portal</div>
                    <div className="text-xs opacity-60">
                      Manage drivers, vehicles, orders
                    </div>
                  </div>

                  <div className="h-[calc(100vh-72px)] overflow-y-auto">
                    <VendorNav />
                    <div className="border-t p-3">
                      <button
                        onClick={onSignOut}
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Vendor</div>
                <div className="hidden sm:block truncate text-xs text-gray-500">
                  Drivers • Vehicles • Bookings • Wallet
                </div>
              </div>
            </div>

            {/* Desktop sign out (optional extra button in header) */}
            <div className="hidden md:block">
              <button
                onClick={onSignOut}
                className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}