'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  Flame,
  ChevronRight,
} from 'lucide-react'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const nav = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/drivers', label: 'Drivers', icon: Users },
  { href: '/vendor/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/vendor/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/vendor/wallet', label: 'Wallet', icon: Wallet },
  { href: '/vendor/documents', label: 'Documents', icon: FileText },
  { href: '/vendor/profile', label: 'Profile Settings', icon: Settings },
]

function VendorNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 p-3">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              'group flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all',
              active
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <span
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                  active
                    ? 'bg-white/15 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.label}</span>
            </div>

            <ChevronRight
              className={[
                'h-4 w-4 transition-transform',
                active ? 'text-white/90' : 'text-gray-400 group-hover:text-blue-600',
              ].join(' ')}
            />
          </Link>
        )
      })}
    </nav>
  )
}

export default function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-blue-100 bg-white md:flex md:w-72 md:flex-col">
        <div className="border-b border-blue-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 text-white shadow-sm">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-gray-900">Vendor Portal</div>
              <div className="text-xs text-gray-500">Manage drivers, vehicles, and bookings</div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <VendorNav />
        </div>

        <div className="border-t border-blue-100 p-4">
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile drawer trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-blue-200 bg-white md:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-[300px] border-r border-blue-100 p-0">
                  <div className="border-b border-blue-100 px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 text-white shadow-sm">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold tracking-tight text-gray-900">
                          Vendor Portal
                        </div>
                        <div className="text-xs text-gray-500">
                          Manage drivers, vehicles, and bookings
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-[calc(100vh-88px)] flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <VendorNav />
                    </div>

                    <div className="border-t border-blue-100 p-4">
                      <button
                        onClick={onSignOut}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">Vendor Dashboard</div>
                <div className="hidden truncate text-xs text-gray-500 sm:block">
                  Control your drivers, bookings, vehicles, and wallet in one place
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                <LogOut className="h-4 w-4" />
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