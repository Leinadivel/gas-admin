export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-gray-500">Last updated: March 2026</p>
            <p className="mt-4 text-base leading-7 text-gray-600">
              These Terms of Service govern your use of the{' '}
              <span className="font-semibold text-gray-900">24hrsGas</span> platform, including our
              website and mobile applications.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-gray-700 sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
              <p className="mt-3">
                By accessing or using 24hrsGas, you agree to be bound by these Terms. If you do not
                agree, you should not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">2. Platform Services</h2>
              <p className="mt-3">
                24hrsGas provides a platform that connects customers, vendors, and drivers for gas
                refill requests, deliveries, and related services. We facilitate transactions and
                platform operations but do not manufacture gas products.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">3. User Accounts</h2>
              <p className="mt-3">
                Users must provide accurate registration information and are responsible for keeping
                their login credentials secure. Accounts may be suspended where fraudulent,
                abusive, or unauthorized activity is detected.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">4. Orders and Fulfillment</h2>
              <p className="mt-3">
                Customers are responsible for providing correct delivery details. Vendors and
                drivers are responsible for accepting, fulfilling, and delivering orders according
                to platform rules and applicable safety standards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">5. Pricing and Payments</h2>
              <p className="mt-3">
                Prices displayed on the platform may include gas cost, delivery fee, and platform
                charges. Payments processed through third-party providers such as Paystack are
                subject to their own terms and verification processes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">6. Vendor and Driver Conduct</h2>
              <p className="mt-3">
                Vendors and drivers must act professionally, follow delivery and safety procedures,
                and avoid any conduct that may endanger customers, property, or public safety.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">7. Prohibited Use</h2>
              <p className="mt-3">Users must not misuse the platform, including by:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Providing false information</li>
                <li>Attempting fraudulent transactions</li>
                <li>Harassing vendors, drivers, or support staff</li>
                <li>Interfering with platform operations or pricing logic</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">8. Account Suspension</h2>
              <p className="mt-3">
                24hrsGas may suspend or terminate any account that violates these Terms or poses a
                risk to the platform, customers, vendors, or drivers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">9. Limitation of Liability</h2>
              <p className="mt-3">
                24hrsGas is not liable for indirect, incidental, or consequential losses arising
                from the use of the platform, delays caused by external factors, or misuse of gas
                products after delivery.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">10. Updates to These Terms</h2>
              <p className="mt-3">
                We may revise these Terms from time to time. Updated versions will be published on
                this page.
              </p>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-xl font-semibold text-gray-900">11. Contact Us</h2>
              <p className="mt-3">
                For questions about these Terms, please contact us at:
              </p>
              <p className="mt-3 font-semibold text-gray-900">support@24hrsgas.com</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}