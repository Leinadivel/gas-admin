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
  Wrench,
  Star,
  ShoppingBag,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Flame className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">GasGo</span>
          </Link>

          <div className="hidden gap-4 sm:flex items-center">
            <Link href="/vendor/login" className="text-sm font-medium hover:text-blue-600">
              Vendor Login
            </Link>
            <a
              href="#get-app"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Get the App
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-20 lg:grid-cols-2 items-center">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <BadgeCheck className="h-4 w-4" />
              Trusted by hundreds of happy customers
            </div>

            <h1 className="text-4xl font-extrabold sm:text-5xl">
              Fast, Safe & Reliable <span className="text-blue-600">Gas Delivery</span> To Your Doorstep
            </h1>

            <p className="text-gray-600 text-lg">
              Order gas refills, track delivery live, and get premium gas accessories — 
              all from your phone. No stress. No long queues.
            </p>

            <div className="flex gap-4 flex-wrap">
              <a
                href="#get-app"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Get the App
              </a>

              <Link
                href="/vendor/login"
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Vendor Portal
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6">
              <Stat value="15,000kg+" label="Gas Refilled" />
              <Stat value="500+" label="Happy Customers" />
              <Stat value="98%" label="On-Time Delivery" />
            </div>
          </div>

          {/* Visual Card */}
          <div className="rounded-3xl border bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Delivery in Progress</p>
                <p className="text-xs text-gray-500">Driver on the way</p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                En Route
              </span>
            </div>

            <div className="mt-6 rounded-2xl bg-blue-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <Truck />
                <div>
                  <p className="font-semibold">GasGo Driver</p>
                  <p className="text-xs opacity-80">ETA 12 mins</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Feature icon={<MapPin />} title="Set Location" desc="Enter address or use GPS to find vendors near you." />
          <Feature icon={<Flame />} title="Request Refill" desc="Choose cylinder size and confirm your order instantly." />
          <Feature icon={<Truck />} title="Track Delivery" desc="Watch your driver move toward you in real-time." />
        </div>
      </section>

      {/* ACCESSORIES */}
      <section className="bg-blue-50 py-20">
        <div className="mx-auto max-w-6xl px-4 grid lg:grid-cols-2 gap-10 items-center">

          <div>
            <h2 className="text-3xl font-bold mb-4">
              We Also Sell <span className="text-orange-500">Gas Accessories</span>
            </h2>

            <p className="text-gray-600 mb-6">
              Need regulators, hoses, burners, cylinders or safety valves? 
              GasGo supplies high-quality gas accessories to keep your home and business running safely.
            </p>

            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-2"><Wrench className="text-orange-500" /> Premium Regulators</li>
              <li className="flex gap-2"><ShoppingBag className="text-orange-500" /> Gas Burners</li>
              <li className="flex gap-2"><ShieldCheck className="text-orange-500" /> Safety Valves</li>
              <li className="flex gap-2"><Flame className="text-orange-500" /> Replacement Cylinders</li>
            </ul>
          </div>

          <div className="rounded-3xl bg-white shadow-lg p-8">
            <div className="text-center">
              <ShoppingBag className="h-10 w-10 mx-auto text-blue-600" />
              <h3 className="text-xl font-semibold mt-4">Reliable & Affordable</h3>
              <p className="text-sm text-gray-600 mt-2">
                All accessories are quality-checked and trusted by hundreds of homes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Our Customers Say
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Testimonial name="Aisha T." text="GasGo saved me from running out of gas during cooking. Super fast delivery!" />
          <Testimonial name="Daniel M." text="Very reliable service. I love tracking the driver live." />
          <Testimonial name="Chinedu O." text="Affordable accessories and safe delivery every time." />
        </div>
      </section>

      {/* CTA */}
      <section id="get-app" className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to Experience Hassle-Free Gas Delivery?
          </h2>

          <p className="text-blue-100">
            Join hundreds of satisfied customers already using GasGo.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="#"
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold"
            >
              Download App
            </a>
            <Link
              href="/vendor/login"
              className="bg-orange-500 px-6 py-3 rounded-xl font-semibold"
            >
              Vendor Login
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} GasGo. All rights reserved.
      </footer>
    </div>
  )
}

/* COMPONENTS */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-blue-600">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="rounded-2xl border p-6 text-center hover:shadow-lg transition">
      <div className="h-10 w-10 mx-auto text-blue-600">{icon}</div>
      <h3 className="font-semibold mt-4">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{desc}</p>
    </div>
  )
}

function Testimonial({ name, text }: any) {
  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <Star className="text-orange-500 h-5 w-5 mb-2" />
      <p className="text-sm text-gray-600">"{text}"</p>
      <p className="mt-4 font-semibold text-sm">{name}</p>
    </div>
  )
}