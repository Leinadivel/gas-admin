// src/app/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flame,
  LifeBuoy,
  MapPin,
  Navigation,
  Package,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'

export default function HomePage() {
  useEffect(() => {
    const handler = (e: Event) => {
      const a = e.target as HTMLElement | null
      const link = a?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || href === '#') return

      const el = document.querySelector(href)
      if (!el) return

      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', href)
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl"
          animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/24hrs-logo.png"
              alt="24hrsGas logo"
              width={140}
              height={56}
              className="h-11 w-auto object-contain"
              priority
            />
            <div className="hidden sm:block">
              <div className="text-base font-extrabold tracking-tight">24hrsGas</div>
              <div className="text-xs text-gray-500">Mobile Gas Refill & Accessories</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="#how"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              How it works
            </a>
            <a
              href="#why-us"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Why us
            </a>
            <a
              href="#accessories"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Accessories
            </a>
            <a
              href="#reviews"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reviews
            </a>

            <Link
              href="/vendor/login"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Vendor login
            </Link>

            <a
              href="#get-app"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Get the app
            </a>
          </div>

          <div className="lg:hidden">
            <a
              href="#get-app"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Get app
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-10 lg:grid-cols-2 lg:gap-14 lg:pb-24 lg:pt-16">
          <div className="space-y-7">
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
              className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl"
            >
              Cooking gas refill to your door,{' '}
              <span className="text-blue-600">without the usual stress</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl text-base leading-8 text-gray-600 sm:text-lg"
            >
              24hrsGas helps homes and businesses refill cooking gas quickly, safely, and
              conveniently. Request a refill from your phone, get matched to a nearby vendor,
              track the assigned driver live, and even add important gas accessories to the same
              delivery. No unnecessary queues. No panic when gas finishes. No wasting time moving
              from one vendor to another.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <a
                href="#get-app"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Get the user app <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                See how it works <Zap className="h-4 w-4" />
              </a>

              <a
                href="#accessories"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Shop accessories <ShoppingBag className="h-4 w-4" />
              </a>
            </motion.div>

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
                value={<span className="text-sm font-bold text-gray-900">10–25 mins</span>}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
              <Badge
                text="Verified vendors & staff"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              />
              <Badge
                text="Live tracking & status updates"
                icon={<Navigation className="h-3.5 w-3.5" />}
              />
              <Badge text="Support when needed" icon={<PhoneCall className="h-3.5 w-3.5" />} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BulletCard
                icon={<ClipboardCheck className="h-5 w-5" />}
                title="Clear updates from start to finish"
                desc="From request received to vendor accepted, driver en route, arrived, and completed, the experience feels organized and easy to follow."
              />
              <BulletCard
                icon={<LifeBuoy className="h-5 w-5" />}
                title="Built for real-life gas delivery"
                desc="Gas refill is not something people want to gamble with. That is why the platform focuses on speed, clarity, support, and confidence."
                accent="orange"
              />
            </div>
          </div>

          {/* HERO RIGHT */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative mx-auto max-w-xl"
            >
              <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Delivery in progress</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Driver heading to your location
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    En route
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <motion.div
                    className="relative w-[250px] rounded-[2.8rem] border border-gray-200 bg-gray-950 shadow-xl sm:w-[275px]"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-gray-900" />
                    <div className="absolute -left-[3px] top-20 h-10 w-[3px] rounded-full bg-gray-800" />
                    <div className="absolute -left-[3px] top-36 h-14 w-[3px] rounded-full bg-gray-800" />
                    <div className="absolute -right-[3px] top-28 h-14 w-[3px] rounded-full bg-gray-800" />

                    <div className="p-3">
                      <div className="rounded-[2.2rem] bg-white">
                        <div className="flex items-center justify-between px-4 pt-4">
                          <div className="flex items-center gap-2">
                            <Image
                              src="/24hrs-logo.png"
                              alt="24hrsGas logo"
                              width={90}
                              height={36}
                              className="h-8 w-auto object-contain"
                            />
                            <div className="text-[11px] text-gray-500">Tracking</div>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                            Live
                          </span>
                        </div>

                        <div className="mt-4 px-4">
                          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
                            <div className="absolute inset-0 opacity-70">
                              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_25%,rgba(37,99,235,0.22)_0,transparent_45%),radial-gradient(circle_at_80%_30%,rgba(249,115,22,0.18)_0,transparent_45%),radial-gradient(circle_at_50%_80%,rgba(37,99,235,0.14)_0,transparent_50%)]" />
                            </div>

                            <div className="relative p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-semibold text-gray-700">
                                  Driver route
                                </div>
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
                                    transition={{
                                      duration: 6,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                    }}
                                  />
                                </div>
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                                  <MapPin className="h-5 w-5" />
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2">
                                <Pill
                                  icon={<ShieldCheck className="h-4 w-4" />}
                                  text="Verified"
                                />
                                <Pill
                                  icon={<ClipboardCheck className="h-4 w-4" />}
                                  text="Order ready"
                                />
                                <Pill
                                  icon={<PhoneCall className="h-4 w-4" />}
                                  text="Call driver"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 px-4 pb-4">
                          <div className="rounded-2xl border border-gray-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold">
                                  Your refill is on the way
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-600">
                                  You will get updates as the driver moves closer. The experience is
                                  designed to be simple, transparent, and easy to trust.
                                </div>
                              </div>
                              <span className="rounded-xl bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                                Active
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <InfoCardLite
                              icon={<Smartphone className="h-5 w-5 text-blue-700" />}
                              title="Order from your phone"
                              desc="Request gas in minutes and monitor delivery in real time."
                            />
                            <InfoCardLite
                              icon={<Store className="h-5 w-5 text-orange-700" />}
                              title="Add accessories"
                              desc="Regulators, hoses, burners, and more in one trip."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <HeroInfoCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="Order confirmed"
                    desc="Nearby vendor accepts quickly."
                    accent="blue"
                  />
                  <HeroInfoCard
                    icon={<Truck className="h-5 w-5" />}
                    title="Driver assigned"
                    desc="Track movement to your location."
                    accent="orange"
                  />
                  <HeroInfoCard
                    icon={<ShoppingBag className="h-5 w-5" />}
                    title="Accessories available"
                    desc="Add safety items to your order."
                    accent="blue"
                  />
                </div>
              </div>

              <motion.div
                className="absolute -right-4 top-10 hidden w-52 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm xl:block"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="text-xs font-semibold">Fast confirmation</div>
                </div>
                <div className="mt-2 text-[11px] leading-5 text-gray-600">
                  Orders move quickly from request to acceptance so customers are not left waiting
                  and guessing.
                </div>
              </motion.div>

              <motion.div
                className="absolute -left-5 bottom-14 hidden w-56 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm xl:block"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  <div className="text-xs font-semibold">Delivered with extras</div>
                </div>
                <div className="mt-2 text-[11px] leading-5 text-gray-600">
                  Need a regulator, hose, burner, or valve too? Add them and receive everything in
                  one delivery.
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ProofItem
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Verified delivery"
              desc="Drivers and vendors are reviewed, verified, and monitored to improve confidence and quality."
              color="blue"
            />
            <ProofItem
              icon={<Clock className="h-5 w-5" />}
              title="Fast dispatch"
              desc="Nearby vendors get notified quickly, helping customers get service without unnecessary delay."
              color="orange"
            />
            <ProofItem
              icon={<MapPin className="h-5 w-5" />}
              title="Live tracking"
              desc="Customers see the journey in real time and know when the driver is close."
              color="blue"
            />
            <ProofItem
              icon={<PhoneCall className="h-5 w-5" />}
              title="Real support"
              desc="When a customer needs help, support is close at hand instead of buried behind a confusing process."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How 24hrsGas works</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            The experience is designed to feel straightforward from the first tap. Customers set
            their location, request the gas refill they need, get matched to a nearby vendor, and
            follow the delivery journey clearly. The result is a smoother experience than the usual
            rush, waiting, and uncertainty that often comes with finding cooking gas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Feature
            step="01"
            icon={<MapPin className="h-5 w-5" />}
            title="Set your location"
            desc="Enter your address or use your current location so nearby vendors can respond faster and delivery stays accurate."
          />
          <Feature
            step="02"
            icon={<Flame className="h-5 w-5" />}
            title="Request your refill"
            desc="Choose cylinder size and quantity, place the order, and get updates as soon as a vendor accepts and a driver is assigned."
            accent="orange"
          />
          <Feature
            step="03"
            icon={<Truck className="h-5 w-5" />}
            title="Track and receive"
            desc="Follow the driver’s movement live, prepare for arrival, and receive your refill with less friction and fewer surprises."
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Callout
            title="Built for reliability, not just attractive screens"
            body="The product experience focuses on clear order states, clean communication, and dependable delivery flow. Every part of the journey is meant to reduce confusion and increase trust."
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <Callout
            title="Accessories can be added to the same order"
            body="Customers do not always need only a refill. Sometimes they also need regulators, hoses, burners, or safety valves. 24hrsGas helps them handle all of that in a single delivery."
            icon={<Package className="h-5 w-5" />}
            accent="orange"
          />
        </div>
      </section>

      {/* WHY US */}
      <section id="why-us" className="bg-gradient-to-b from-gray-50 to-white py-16 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Why customers prefer 24hrsGas
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
              This is not only about getting gas delivered. It is about making the whole process
              feel cleaner, safer, and more professional. 24hrsGas turns a stressful household need
              into a digital experience that feels premium and dependable.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ValueCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Trustworthy fulfillment"
              desc="Verified vendors and clearer delivery flow help users feel more confident from order to arrival."
              accent="blue"
            />
            <ValueCard
              icon={<Clock className="h-5 w-5" />}
              title="Saves real time"
              desc="Customers avoid long queues, urgent late-night searches, and unnecessary movement across town."
              accent="orange"
            />
            <ValueCard
              icon={<Navigation className="h-5 w-5" />}
              title="Live visibility"
              desc="Instead of waiting blindly, customers can see progress and prepare for delivery with confidence."
              accent="blue"
            />
            <ValueCard
              icon={<ShoppingBag className="h-5 w-5" />}
              title="More than refill"
              desc="The platform can also help with important gas accessories that customers may need immediately."
              accent="orange"
            />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <HighlightCard
              title="For homes"
              desc="Perfect for households that want fast refill delivery without last-minute panic when cooking gas runs out."
            />
            <HighlightCard
              title="For busy professionals"
              desc="Useful for people who do not have time to leave work, enter queues, or manage uncertain refill plans."
            />
            <HighlightCard
              title="For small businesses"
              desc="A smart option for restaurants, food spots, and other small operators who need steadier gas access."
            />
          </div>
        </div>
      </section>

      {/* ACCESSORIES */}
      <section id="accessories" className="scroll-mt-24 bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              <Wrench className="h-4 w-4" />
              Accessories • Safety • Convenience
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              We also supply <span className="text-orange-500">gas accessories</span>
            </h2>

            <p className="text-sm leading-7 text-gray-700 sm:text-base">
              24hrsGas is not limited to refills alone. Customers can also access important gas
              accessories that improve safety, convenience, and long-term reliability. That means
              fewer separate errands and a more complete delivery experience.
            </p>

            <p className="text-sm leading-7 text-gray-600 sm:text-base">
              If someone needs a regulator, hose, burner, or safety valve, they can get it from the
              same service flow. This makes the platform more practical for people who want one
              smooth solution rather than several disconnected ones.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AccessoryItem
                title="Premium regulators"
                desc="Stable pressure control for safer, more efficient gas use."
              />
              <AccessoryItem
                title="High-quality hoses"
                desc="Durable hoses designed for daily use and improved peace of mind."
              />
              <AccessoryItem
                title="Burners & stoves"
                desc="Reliable performance for homes and small business environments."
              />
              <AccessoryItem
                title="Safety valves"
                desc="Extra protection that supports a safer overall setup."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#get-app"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Order with the app <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#reviews"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                See reviews <Star className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Accessory bundle</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Add useful items to the same delivery.
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Popular
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex items-center justify-center">
                  <motion.div
                    className="relative"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <MockCylinder />
                    <div className="mt-3 text-center">
                      <div className="text-sm font-semibold">Cylinder-friendly ordering</div>
                      <div className="text-xs text-gray-600">
                        Select size and quantity with a simple, guided flow.
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <AccessoryCard
                    icon={<Wrench className="h-4 w-4" />}
                    title="Regulator"
                    desc="Steady pressure and reliable performance."
                  />
                  <AccessoryCard
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Safety valve"
                    desc="Extra support for safer everyday use."
                  />
                  <AccessoryCard
                    icon={<Flame className="h-4 w-4" />}
                    title="Burner"
                    desc="Clean heat and consistent output."
                  />
                  <AccessoryCard
                    icon={<Package className="h-4 w-4" />}
                    title="Hose"
                    desc="Durable, practical, and built for regular use."
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <InfoBand
                icon={<ShoppingBag className="h-5 w-5" />}
                title="One delivery, more convenience"
                desc="Refill plus accessories in one order reduces stress and saves time."
                accent="orange"
              />
              <InfoBand
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Safety-first sourcing"
                desc="The focus is not only speed, but also helping customers feel secure about what they are buying."
                accent="blue"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Customers are already loving 24hrsGas
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
            The best part of the platform is how it turns a stressful need into a smoother
            experience. Customers appreciate the speed, clarity, delivery flow, and the ability to
            handle extras without needing a second trip.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Testimonial
            name="Aisha T."
            role="Home cook"
            text="24hrsGas saved me when I was almost out of gas in the middle of cooking. I could track the driver and everything felt much more organized than the usual refill process."
          />
          <Testimonial
            name="Daniel M."
            role="Busy professional"
            text="What I liked most was how clear the order flow felt. I knew when it was accepted, when the driver was moving, and when I should get ready. It felt professional."
          />
          <Testimonial
            name="Chinedu O."
            role="Small business owner"
            text="I added a regulator and hose to my refill order and received everything together. That one delivery saved me extra time and made the whole thing much more convenient."
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RatingCard
            title="Average rating"
            value="4.8/5"
            desc="From positive customer experiences"
          />
          <RatingCard
            title="Refilled volume"
            value="15,000kg+"
            desc="Delivered across homes and businesses"
          />
          <RatingCard
            title="Repeat usage"
            value="High"
            desc="Customers come back because the service feels dependable"
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="get-app" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16">
        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-sm sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                <Smartphone className="h-4 w-4" />
                Ready when you are
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Ready for stress-free gas refill delivery?
              </h3>

              <p className="max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
                Download the app to request refills, track deliveries, and add accessories when
                needed. The goal is simple: make the whole experience cleaner, faster, and more
                reassuring for every customer.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StoreBadge label="Download on the" store="App Store" />
                <StoreBadge label="Get it on" store="Google Play" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CtaCard
                title="Fast ordering"
                desc="Open the app, request a refill, and get the process started quickly."
              />
              <CtaCard
                title="Clear tracking"
                desc="See progress in real time instead of guessing when delivery will happen."
              />
              <CtaCard
                title="Useful extras"
                desc="Add important gas accessories in the same flow when needed."
              />
              <CtaCard
                title="Reliable support"
                desc="A smoother experience backed by better clarity and communication."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/24hrs-logo.png"
              alt="24hrsGas logo"
              width={110}
              height={44}
              className="h-9 w-auto object-contain"
            />
            <div className="text-xs text-gray-500">
              © {new Date().getFullYear()} 24hrsGas. All rights reserved.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="#how" className="text-gray-600 transition hover:text-gray-900">
              How it works
            </a>
            <a href="#why-us" className="text-gray-600 transition hover:text-gray-900">
              Why us
            </a>
            <a href="#accessories" className="text-gray-600 transition hover:text-gray-900">
              Accessories
            </a>
            <a href="#reviews" className="text-gray-600 transition hover:text-gray-900">
              Reviews
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
            >
              Terms of Service
            </a>
            <a
              href="/delivery-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
            >
              Delivery Policy
            </a>
            <a
              href="/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
            >
              Support
            </a>
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
    <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-sm">
      <span className="text-blue-700">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  )
}

function InfoCardLite({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function BulletCard({
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
  const wrap = accent === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${wrap}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function HeroInfoCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent: 'blue' | 'orange'
}) {
  const cls =
    accent === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${cls}`}>
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
        </div>
      </div>
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
  const wrap = color === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'

  return (
    <div className="flex items-start gap-3">
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${wrap}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
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
    accent === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
  const stepPill =
    accent === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${stepPill}`}>{step}</span>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrap}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-7 text-gray-600">{desc}</p>
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
  const wrap = accent === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${wrap}`}>
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-2 text-sm leading-7 text-gray-600">{body}</div>
        </div>
      </div>
    </div>
  )
}

function ValueCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent: 'blue' | 'orange'
}) {
  const cls =
    accent === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : 'bg-blue-50 text-blue-700'

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${cls}`}>
        {icon}
      </span>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-7 text-gray-600">{desc}</div>
    </div>
  )
}

function HighlightCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-base font-semibold text-gray-900">{title}</div>
      <div className="mt-2 text-sm leading-7 text-gray-600">{desc}</div>
    </div>
  )
}

function AccessoryItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
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
        <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
      </div>
    </div>
  )
}

function InfoBand({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent: 'blue' | 'orange'
}) {
  const cls =
    accent === 'orange'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-blue-100 text-blue-700'

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${cls}`}>
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 text-xs leading-5 text-gray-600">{desc}</div>
        </div>
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
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-1 text-orange-500">
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
        <Star className="h-4 w-4 fill-current" />
      </div>
      <p className="mt-4 text-sm leading-7 text-gray-700">“{text}”</p>
      <div className="mt-5">
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
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-blue-600">{value}</div>
      <div className="mt-1 text-sm leading-6 text-gray-600">{desc}</div>
    </div>
  )
}

function StoreBadge({ label, store }: { label: string; store: string }) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/15"
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

function CtaCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-5 text-white/80">{desc}</div>
    </div>
  )
}

function MockCylinder() {
  return (
    <div className="relative w-44">
      <div className="mx-auto h-7 w-24 rounded-t-3xl border border-gray-300 bg-gray-50" />
      <div className="mx-auto -mt-2 h-4 w-10 rounded-lg border border-gray-300 bg-white" />
      <div className="relative -mt-2 rounded-3xl border border-gray-200 bg-gradient-to-b from-blue-600 to-blue-700 p-4 shadow-md">
        <div className="absolute inset-x-0 top-3 mx-auto h-2 w-24 rounded-full bg-white/20" />
        <div className="mt-6 text-center text-white">
          <div className="text-xs font-semibold opacity-90">24hrsGas</div>
          <div className="text-[11px] opacity-80">Cylinder</div>
        </div>
        <div className="mt-6 h-2 w-full rounded-full bg-white/15" />
      </div>
      <div className="mx-auto mt-2 h-4 w-32 rounded-full bg-gray-200" />
    </div>
  )
}