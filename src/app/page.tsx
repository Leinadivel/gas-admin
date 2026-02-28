// src/app/page.tsx
import Link from 'next/link'
import {
  Flame,
  MapPin,
  Truck,
  ShieldCheck,
  Clock,
  Smartphone,
  ArrowRight,
  BadgeCheck,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top gradient backdrop */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />

        {/* Navbar */}
        <header className="relative z-10">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Flame className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <div className="text-base font-semibold">GasGo</div>
                <div className="text-xs text-gray-500">Mobile Gas Refill</div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/vendor/login"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Vendor login
              </Link>
              <a
                href="#get-app"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Get the app
              </a>
            </div>

            <div className="sm:hidden">
              <a
                href="#get-app"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Get the app
              </a>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative z-10">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-6 lg:grid-cols-2 lg:pb-20 lg:pt-10">
            {/* Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <BadgeCheck className="h-4 w-4" />
                Fast delivery • Verified vendors • Live tracking
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Gas refill to your door,{' '}
                <span className="text-blue-600">in minutes</span>.
              </h1>

              <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                GasGo connects users with nearby gas vendors and drivers for quick, safe
                refills—right where you are. Request, track, and receive delivery without stress.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#get-app"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Get the user app <ArrowRight className="h-4 w-4" />
                </a>

                <Link
                  href="/vendor/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  Vendor portal login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MiniStat icon={<Clock className="h-4 w-4" />} label="Quick dispatch" value="Near-instant" />
                <MiniStat icon={<ShieldCheck className="h-4 w-4" />} label="Safety first" value="Verified staff" />
                <MiniStat icon={<MapPin className="h-4 w-4" />} label="Live tracking" value="To your doorstep" />
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Delivery in progress</div>
                    <div className="mt-1 text-xs text-gray-500">Driver heading to your location</div>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    En route
                  </span>
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                        <Truck className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold">GasGo Driver</div>
                        <div className="text-xs opacity-80">Arriving soon</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold opacity-90">ETA 12 mins</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Pill icon={<MapPin className="h-4 w-4" />} text="Live location" />
                    <Pill icon={<Flame className="h-4 w-4" />} text="Refill ready" />
                    <Pill icon={<ShieldCheck className="h-4 w-4" />} text="Verified" />
                  </div>

                  {/* Fake map */}
                  <div className="relative mt-2 overflow-hidden rounded-2xl bg-white/10">
                    <div className="absolute inset-0 opacity-60">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35)_0,transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.25)_0,transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.22)_0,transparent_45%)]" />
                    </div>
                    <div className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold">Map preview</div>
                        <div className="text-[11px] opacity-80">Tracking enabled</div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-sm">
                          <Flame className="h-5 w-5 text-white" />
                        </span>
                        <div className="h-1.5 flex-1 rounded-full bg-white/20">
                          <div className="h-1.5 w-2/3 rounded-full bg-orange-300" />
                        </div>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <MapPin className="h-5 w-5 text-white" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoCard
                    icon={<Smartphone className="h-5 w-5 text-blue-700" />}
                    title="User app"
                    desc="Request refills & track delivery."
                    ctaHref="#get-app"
                    cta="Get the app"
                    ctaStyle="primary"
                  />
                  <InfoCard
                    icon={<Truck className="h-5 w-5 text-orange-700" />}
                    title="Vendor portal"
                    desc="Manage drivers & orders."
                    ctaHref="/vendor/login"
                    cta="Vendor login"
                    ctaStyle="secondary"
                  />
                </div>
              </div>

              <div className="mt-4 text-center text-xs text-gray-500">
                Built for speed, safety, and reliable doorstep delivery.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-bold">How GasGo works</h2>
          <p className="text-sm text-gray-600">
            A simple flow designed for real-life deliveries.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Feature
            icon={<MapPin className="h-5 w-5" />}
            title="Set your location"
            desc="Enter your address or use current location."
          />
          <Feature
            icon={<Flame className="h-5 w-5" />}
            title="Request a refill"
            desc="Choose cylinder size and place your order."
            accent="orange"
          />
          <Feature
            icon={<Truck className="h-5 w-5" />}
            title="Track delivery"
            desc="A nearby driver delivers to your doorstep."
          />
        </div>
      </section>

      {/* CTA */}
      <section id="get-app" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-sm">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Ready to refill without stress?</h3>
              <p className="text-sm text-white/85">
                Users: download the app and request a refill in seconds. Vendors: log in to manage
                your drivers, vehicles, and orders.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-white/95"
                aria-label="Get the user app"
              >
                Get the app <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Vendor login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          * “Get the app” can link to Play Store / App Store later.
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Flame className="h-4 w-4" />
            </span>
            <div className="text-sm font-semibold">GasGo</div>
            <div className="text-xs text-gray-500">© {new Date().getFullYear()}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/vendor/login" className="text-gray-600 hover:text-gray-900">
              Vendor login
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Admin login
            </Link>
            <a href="#get-app" className="text-gray-600 hover:text-gray-900">
              Get the app
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-blue-700">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50">
          {icon}
        </span>
        <div className="text-xs font-semibold text-gray-700">{label}</div>
      </div>
      <div className="mt-2 text-sm font-bold text-gray-900">{value}</div>
    </div>
  )
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
      {icon}
      <span className="opacity-95">{text}</span>
    </div>
  )
}

function Feature({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent?: 'orange'
}) {
  const iconWrap =
    accent === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrap}`}>
        {icon}
      </div>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function InfoCard({
  icon,
  title,
  desc,
  ctaHref,
  cta,
  ctaStyle,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  ctaHref: string
  cta: string
  ctaStyle: 'primary' | 'secondary'
}) {
  const btn =
    ctaStyle === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-gray-600">{desc}</div>
        </div>
      </div>

      <Link
        href={ctaHref}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${btn}`}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}