'use client'

import { usePathname } from 'next/navigation'
import { SidebarNav } from './sidebar-nav'
import { SignOutButton } from './signout-button'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Hide sidebar/header on auth pages
  const isAuthRoute =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/vendor/login' ||
    pathname.startsWith('/vendor/login/') ||
    pathname === '/vendor/register' ||
    pathname.startsWith('/vendor/register/') ||
    pathname.startsWith('/vendor/')

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white">
        <div className="px-4 py-4 border-b">
          <div className="text-lg font-semibold">GasGo Admin</div>
          <div className="text-xs opacity-60">Mobile Gas Refill Console</div>
        </div>

        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Header */}
        <header className="h-14 border-b bg-white flex items-center justify-between px-4">
          <div className="text-sm font-medium">Admin</div>
          <SignOutButton />
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
