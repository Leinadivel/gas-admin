// src/app/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
  PhoneCall,
  CheckCircle2,
  Users,
  Sparkles,
  Package,
  ClipboardCheck,
  Navigation,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* BACKDROP BLOBS */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl"
          animate={{ y: [0, -16, 0], x: [0, 14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b bg-white/75 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <Flame className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">GasGo</div>
              <div className="text-xs text-gray-500">Mobile Gas Refill & Accessories</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <a href="#how" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              How it works
            </a>
            <a href="#accessories" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Accessories
            </a>
            <a href="#reviews" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Reviews
            </a>
            <Link
              href="/vendor/login"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
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

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-10 lg:grid-cols-2 lg:pb-20 lg:pt-14">
          {/* LEFT */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
            >
              <BadgeCheck className="h-4 w-4" />
              Fast delivery • Verified vendors • Real-time tracking
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl"
            >
              Gas refill to your door,{' '}
              <span className="text-blue-600">with zero stress</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg"
            >
              GasGo helps you refill cooking gas quickly and safely—right where you are.
              Request a refill from your phone, get matched to a nearby vendor, and track the
              driver live as they come to you. No long queues, no last-minute panic, no guesswork.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <a
                href="#get-app"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Get the user app <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
              >
                Vendor portal <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#accessories"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Shop accessories <ShoppingBag className="h-4 w-4" />
              </a>
            </motion.div>

            {/* TRUST + STATS */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniStat
                icon={<Sparkles className="h-4 w-4" />}
                label="Refilled so far"
                value={<AnimatedNumber end={15000} suffix="kg+" />}
              />
              <MiniStat
                icon={<Users className="h-4 w-4" />}
                label="Happy customers"
                value={<AnimatedNumber end={500} suffix="+" />}
              />
              <MiniStat
                icon={<Clock className="h-4 w-4" />}
                label="Typical ETA"
                value="10–25 mins"
              />
            </div>

            {/* BADGES */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
              <Badge text="Verified vendors & staff" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
              <Badge text="Live tracking & updates" icon={<Navigation className="h-3.5 w-3.5" />} />
              <Badge text="Support by phone" icon={<PhoneCall className="h-3.5 w-3.5" />} />
            </div>
          </div>

          {/* RIGHT: FLOATING PHONE UI */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative mx-auto max-w-md"
            >
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Delivery in progress</div>
                    <div className="mt-1 text-xs text-gray-500">Driver heading to your location</div>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    En route
                  </span>
                </div>

                {/* Phone mock */}
                <div className="mt-5 flex items-center justify-center">
                  <motion.div
                    className="relative w-[290px] rounded-[2.2rem] border border-gray-200 bg-gray-950 shadow-lg"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* Notch */}
                    <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-gray-900" />
                    <div className="p-3">
                      <div className="rounded-[1.85rem] bg-white">
                        {/* App header */}
                        <div className="flex items-center justify-between px-4 pt-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white">
                              <Flame className="h-5 w-5" />
                            </span>
                            <div className="leading-tight">
                              <div className="text-sm font-semibold">GasGo</div>
                              <div className="text-[11px] text-gray-500">Tracking</div>
                            </div>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                            Live
                          </span>
                        </div>

                        {/* Map mock */}
                        <div className="mt-4 px-4">
                          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
                            <div className="absolute inset-0 opacity-70">
                              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_25%,rgba(37,99,235,0.22)_0,transparent_45%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.18)_0,transparent_45%),radial-gradient(circle_at_50%_80%,rgba(37,99,235,0.14)_0,transparent_50%)]" />
                            </div>

                            {/* Route line */}
                            <div className="relative p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-semibold text-gray-700">Driver route</div>
                                <div className="text-[11px] text-gray-500">ETA 12 mins</div>
                              </div>
                              <div className="mt-4 flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
                                  <Truck className="h-5 w-5" />
                                </span>
                                <div className="h-2 flex-1 rounded-full bg-blue-100">
                                  <motion.div
                                    className="h-2 rounded-full bg-blue-600"
                                    initial={{ width: '35%' }}
                                    animate={{ width: ['35%', '70%', '52%'] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                  />
                                </div>
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                                  <MapPin className="h-5 w-5" />
                                </span>
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-2">
                                <Pill icon={<ShieldCheck className="h-4 w-4" />} text="Verified" />
                                <Pill icon={<ClipboardCheck className="h-4 w-4" />} text="Order ready" />
                                <Pill icon={<PhoneCall className="h-4 w-4" />} text="Call driver" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom card */}
                        <div className="mt-4 px-4 pb-4">
                          <div className="rounded-2xl border border-gray-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold">Your refill is on the way</div>
                                <div className="mt-1 text-xs text-gray-600">
                                  You’ll get a notification when the driver arrives. If you need help,
                                  you can call support from the app.
                                </div>
                              </div>
                              <span className="rounded-xl bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Small info cards */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoCard
                    icon={<Smartphone className="h-5 w-5 text-blue-700" />}
                    title="User app"
                    desc="Request refills, track delivery, and reorder anytime."
                    ctaHref="#get-app"
                    cta="Get the app"
                    ctaStyle="primary"
                  />
                  <InfoCard
                    icon={<Truck className="h-5 w-5 text-orange-700" />}
                    title="Vendor portal"
                    desc="Manage drivers, vehicles, pricing, and orders in one place."
                    ctaHref="/vendor/login"
                    cta="Vendor login"
                    ctaStyle="secondary"
                  />
                </div>
              </div>

              {/* Floating mini cards */}
              <motion.div
                className="absolute -right-4 top-10 hidden w-44 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:block"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="text-xs font-semibold">Order confirmed</div>
                </div>
                <div className="mt-2 text-[11px] text-gray-600">
                  Vendor accepted your request. Driver assigned automatically.
                </div>
              </motion.div>

              <motion.div
                className="absolute -left-4 bottom-14 hidden w-48 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:block"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  <div className="text-xs font-semibold">Accessories available</div>
                </div>
                <div className="mt-2 text-[11px] text-gray-600">
                  Regulators, hoses, burners, valves—delivered with your refill.
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <ProofItem
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Verified delivery"
              desc="Drivers and vendors are reviewed, verified, and monitored for quality."
              color="blue"
            />
            <ProofItem
              icon={<Clock className="h-5 w-5" />}
              title="Fast dispatch"
              desc="Nearby vendors get notified instantly so you’re not left waiting."
              color="orange"
            />
            <ProofItem
              icon={<MapPin className="h-5 w-5" />}
              title="Live tracking"
              desc="Track the driver’s route and get arrival updates in real time."
              color="blue"
            />
            <ProofItem
              icon={<PhoneCall className="h-5 w-5" />}
              title="Real support"
              desc="Need help? Reach support quickly—because deliveries are real life."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight">How GasGo works</h2>
          <p className="mt-2 text-sm text-gray-600">
            We designed GasGo for everyday cooking: quick request, fair pricing, verified fulfillment,
            and a smooth delivery experience. Here’s the simple flow:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Feature
            step="01"
            icon={<MapPin className="h-5 w-5" />}
            title="Set your location"
            desc="Type your delivery address or use your current location. This helps us match you with vendors closest to you."
          />
          <Feature
            step="02"
            icon={<Flame className="h-5 w-5" />}
            title="Request a refill"
            desc="Choose your cylinder size and quantity. You’ll see updates as soon as a vendor accepts and a driver is assigned."
            accent="orange"
          />
          <Feature
            step="03"
            icon={<Truck className="h-5 w-5" />}
            title="Track and receive"
            desc="Track the driver live as they navigate to you. When they arrive, you’ll get an instant notification."
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Callout
            title="Built for reliability, not just “nice UI”"
            body="Orders have clear statuses, vendor availability is respected, and we keep customers informed at every step so you always know what’s happening."
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <Callout
            title="Vendors: grow faster with a proper portal"
            body="Manage drivers, vehicles, orders, and dispatch flow from one place. Inviting drivers is simple, and your team can set passwords securely."
            icon={<Package className="h-5 w-5" />}
            accent="orange"
          />
        </div>
      </section>

      {/* ACCESSORIES */}
      <section id="accessories" className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 lg:grid-cols-2">
          {/* Left */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              <Wrench className="h-4 w-4" />
              Accessories • Safety • Convenience
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight">
              We also sell <span className="text-orange-500">gas accessories</span>
            </h2>

            <p className="text-gray-700">
              Beyond refills, GasGo supplies quality gas accessories that help your home or business
              stay safe and efficient. If you’ve ever dealt with weak regulators, worn hoses, or
              unreliable valves, you’ll appreciate having trusted parts delivered with your refill.
            </p>

            <p className="text-gray-600">
              Accessories are quality-checked and sourced from reliable suppliers. We focus on
              safety first—because your gas setup should be stable, leak-free, and dependable.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AccessoryItem title="Premium regulators" desc="Stable pressure control for efficient cooking." />
              <AccessoryItem title="High-quality hoses" desc="Durable, heat-safe hoses built for daily use." />
              <AccessoryItem title="Burners & stoves" desc="Performance-focused burners for clean flame." />
              <AccessoryItem title="Safety valves" desc="Extra protection for peace of mind at home." />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#get-app"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Order with the app <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Vendor portal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: accessories mock + cylinder */}
          <div className="relative">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Accessory bundle</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Add accessories to your delivery for convenience.
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Popular
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Cylinder mock */}
                <div className="flex items-center justify-center">
                  <motion.div
                    className="relative"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <MockCylinder />
                    <div className="mt-3 text-center">
                      <div className="text-sm font-semibold">Cylinder size fit</div>
                      <div className="text-xs text-gray-600">
                        Choose your cylinder size and we’ll handle the rest.
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <AccessoryCard icon={<Wrench className="h-4 w-4" />} title="Regulator" desc="Stable pressure, reliable flame." />
                  <AccessoryCard icon={<ShieldCheck className="h-4 w-4" />} title="Safety valve" desc="Added safety for home use." />
                  <AccessoryCard icon={<Flame className="h-4 w-4" />} title="Burner" desc="Efficient heat and clean output." />
                  <AccessoryCard icon={<Package className="h-4 w-4" />} title="Hose" desc="Durable & heat-safe material." />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">One delivery, everything you need</div>
                  <div className="text-xs text-gray-600">
                    Refill + accessories together saves time and reduces emergency runs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight">Customers are already loving GasGo</h2>
          <p className="mt-2 text-sm text-gray-600">
            We’re proud of the feedback we’ve received. GasGo is built around real customer needs:
            fast refills, clear updates, and safe service you can trust.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Testimonial
            name="Aisha T."
            role="Home cook"
            text="GasGo saved me when I was about to run out mid-cooking. The driver arrived quickly, and I could track the entire route. Smooth experience."
          />
          <Testimonial
            name="Daniel M."
            role="Busy professional"
            text="I like the simple flow: request → vendor accepts → driver arrives. It feels organized and professional. No guessing and no stress."
          />
          <Testimonial
            name="Chinedu O."
            role="Small business"
            text="The accessories are quality and affordable. I added a regulator and hose to my delivery, and everything came in one trip. Excellent."
          />
        </div>

        {/* Ratings strip */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RatingCard title="Average rating" value="4.8/5" desc="From real customer feedback" />
          <RatingCard title="Refilled volume" value="15,000kg+" desc="Delivered safely to homes & businesses" />
          <RatingCard title="Repeat orders" value="High" desc="Customers reorder because it’s reliable" />
        </div>
      </section>

      {/* CTA */}
      <section id="get-app" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-sm">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold tracking-tight">
                Ready for stress-free refills?
              </h3>
              <p className="text-sm text-white/85">
                Download the app to request refills and track deliveries. Vendors can log in to manage
                drivers, vehicles, and incoming orders—built for real operations, not guesswork.
              </p>

              {/* Store badges (placeholders) */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <StoreBadge label="Download on the" store="App Store" />
                <StoreBadge label="Get it on" store="Google Play" />
              </div>

              <div className="mt-4 text-xs text-white/80">
                * Store links can be connected later. For now, keep “Get the app” as your launch CTA.
              </div>
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
      </section>

      {/* FOOTER */}
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
            <a href="#how" className="text-gray-600 hover:text-gray-900">
              How it works
            </a>
            <a href="#accessories" className="text-gray-600 hover:text-gray-900">
              Accessories
            </a>
            <a href="#reviews" className="text-gray-600 hover:text-gray-900">
              Reviews
            </a>
            <Link href="/vendor/login" className="text-gray-600 hover:text-gray-900">
              Vendor login
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Admin login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* --------------------------
   SMALL COMPONENTS
--------------------------- */

function AnimatedNumber({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    let raf = 0
    const duration = 900
    const start = performance.now()

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end])

  const formatted = useMemo(() => val.toLocaleString(), [val])
  return (
    <span className="text-sm font-bold text-gray-900">
      {formatted}
      {suffix}
    </span>
  )
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-blue-700">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50">
          {icon}
        </span>
        <div className="text-xs font-semibold text-gray-700">{label}</div>
      </div>
      <div className="mt-2">{value}</div>
    </div>
  )
}

function Badge({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
      <span className="text-blue-600">{icon}</span>
      <span>{text}</span>
    </span>
  )
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-gray-700">
      <span className="text-blue-700">{icon}</span>
      <span className="truncate">{text}</span>
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

function ProofItem({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  color: 'blue' | 'orange'
}) {
  const wrap =
    color === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <div className="flex items-start gap-3">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${wrap}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-gray-600">{desc}</div>
      </div>
    </div>
  )
}

function Feature({
  step,
  icon,
  title,
  desc,
  accent,
}: {
  step: string
  icon: React.ReactNode
  title: string
  desc: string
  accent?: 'orange'
}) {
  const iconWrap =
    accent === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700'

  const stepPill =
    accent === 'orange'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-blue-100 text-blue-700'

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${stepPill}`}>
          {step}
        </span>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrap}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
    </div>
  )
}

function Callout({
  title,
  body,
  icon,
  accent,
}: {
  title: string
  body: string
  icon: React.ReactNode
  accent?: 'orange'
}) {
  const wrap =
    accent === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${wrap}`}>
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-2 text-sm leading-relaxed text-gray-600">{body}</div>
        </div>
      </div>
    </div>
  )
}

function AccessoryItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-gray-600">{desc}</div>
    </div>
  )
}

function AccessoryCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-gray-600">{desc}</div>
      </div>
    </div>
  )
}

function Testimonial({
  name,
  role,
  text,
}: {
  name: string
  role: string
  text: string
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-1 text-orange-500">
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-700">“{text}”</p>
      <div className="mt-4">
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
  )
}

function RatingCard({
  title,
  value,
  desc,
}: {
  title: string
  value: string
  desc: string
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-blue-600">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{desc}</div>
    </div>
  )
}

function StoreBadge({ label, store }: { label: string; store: string }) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
        <Smartphone className="h-5 w-5 text-white" />
      </span>
      <div className="leading-tight">
        <div className="text-[11px] text-white/80">{label}</div>
        <div className="text-sm font-semibold">{store}</div>
      </div>
    </a>
  )
}

/* Mock gas cylinder (pure divs) */
function MockCylinder() {
  return (
    <div className="relative w-44">
      {/* top handle */}
      <div className="mx-auto h-7 w-24 rounded-t-3xl border border-gray-300 bg-gray-50" />
      {/* valve */}
      <div className="mx-auto -mt-2 h-4 w-10 rounded-lg border border-gray-300 bg-white" />
      {/* body */}
      <div className="relative -mt-2 rounded-3xl border border-gray-200 bg-gradient-to-b from-blue-600 to-blue-700 p-4 shadow-md">
        <div className="absolute inset-x-0 top-3 mx-auto h-2 w-24 rounded-full bg-white/20" />
        <div className="mt-6 text-center text-white">
          <div className="text-xs font-semibold opacity-90">GasGo</div>
          <div className="text-[11px] opacity-80">Cylinder</div>
        </div>
        <div className="mt-6 h-2 w-full rounded-full bg-white/15" />
      </div>
      {/* base */}
      <div className="mx-auto mt-2 h-4 w-32 rounded-full bg-gray-200" />
    </div>
  )
}