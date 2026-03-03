'use client'

import { usePathname } from 'next/navigation'
import { SidebarNav } from './sidebar-nav'
import { SignOutButton } from './signout-button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const ADMIN_PREFIXES = [
  '/dashboard',
  '/profiles',
  '/orders',
  '/vendors',
  '/payouts',
  '/transactions',
  '/settings',
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Only wrap *admin* pages with the admin shell.
  // Everything else (landing, vendor portal, driver pages, auth callbacks, etc.) renders bare.
  const isAdminRoute = ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (!isAdminRoute) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
        <div className="border-b px-4 py-4">
          <div className="text-lg font-semibold">GasGo Admin</div>
          <div className="text-xs opacity-60">Mobile Gas Refill Console</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav />
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
                    {/* simple hamburger */}
                    <span className="text-lg leading-none">☰</span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-[280px] p-0">
                  <div className="border-b px-4 py-4">
                    <div className="text-lg font-semibold">GasGo Admin</div>
                    <div className="text-xs opacity-60">
                      Mobile Gas Refill Console
                    </div>
                  </div>

                  <div className="h-[calc(100vh-72px)] overflow-y-auto">
                    <SidebarNav />
                    <div className="border-t p-3">
                      <SignOutButton />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Admin</div>
                <div className="hidden sm:block truncate text-xs text-gray-500">
                  Manage orders, vendors, payouts, pricing
                </div>
              </div>
            </div>

            {/* Desktop sign out */}
            <div className="hidden md:block">
              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}