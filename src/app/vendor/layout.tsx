import VendorShell from './vendor-shell'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorShell>{children}</VendorShell>
}
