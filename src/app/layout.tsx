import type { Metadata } from 'next'
import './globals.css'
import AdminShell from './admin-shell'

export const metadata: Metadata = {
  title: 'Gas Admin',
  description: 'Admin dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
