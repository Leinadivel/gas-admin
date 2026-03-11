export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">Last updated: March 2026</p>
            <p className="mt-4 text-base leading-7 text-gray-600">
              This Privacy Policy explains how <span className="font-semibold text-gray-900">24hrsGas</span>{' '}
              collects, uses, stores, and protects information when you use our mobile and web
              platform.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-gray-700 sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
              <p className="mt-3">
                When you use 24hrsGas, we may collect certain personal and service-related
                information, including:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Delivery address</li>
                <li>Order and transaction history</li>
                <li>Basic account and device information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">2. Location Data</h2>
              <p className="mt-3">
                24hrsGas may collect location information to help match customers with nearby gas
                vendors, calculate delivery distance, and support driver navigation during order
                fulfillment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">3. Payments</h2>
              <p className="mt-3">
                Payments are processed securely through third-party payment providers such as
                Paystack. 24hrsGas does not store customer card details on its servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">4. How We Use Information</h2>
              <p className="mt-3">We use collected information to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Create and manage user accounts</li>
                <li>Process gas refill and delivery requests</li>
                <li>Match customers with vendors and drivers</li>
                <li>Provide order tracking and support</li>
                <li>Improve service performance and platform reliability</li>
                <li>Prevent fraud, abuse, and unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">5. Data Sharing</h2>
              <p className="mt-3">
                We may share limited information with vendors, drivers, payment providers, and
                legal authorities where necessary to operate the service, complete transactions, or
                comply with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">6. Data Security</h2>
              <p className="mt-3">
                We use appropriate technical and administrative safeguards to protect user
                information. However, no online platform can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">7. Data Retention</h2>
              <p className="mt-3">
                We retain information only for as long as necessary to provide our services,
                maintain transaction records, resolve disputes, and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">8. Policy Updates</h2>
              <p className="mt-3">
                This Privacy Policy may be updated from time to time. Any changes will be published
                on this page with an updated effective date.
              </p>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-xl font-semibold text-gray-900">9. Contact Us</h2>
              <p className="mt-3">
                If you have questions about this Privacy Policy or how your data is handled, please
                contact us at:
              </p>
              <p className="mt-3 font-semibold text-gray-900">support@24hrsgas.com</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}