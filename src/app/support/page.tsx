export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Support
            </h1>
            <p className="mt-3 text-sm text-gray-500">24hrsGas Help Center</p>
            <p className="mt-4 text-base leading-7 text-gray-600">
              If you need help with an order, payment, vendor issue, or driver issue, contact the
              24hrsGas support team using the details below.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Email Support</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Send us an email for account issues, payment concerns, or delivery problems.
              </p>
              <p className="mt-4 font-semibold text-gray-900">support@24hrsgas.com</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Response Time</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Most support requests are reviewed within 24 hours. Urgent safety issues should be
                reported immediately.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700 sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">Common Issues We Can Help With</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Order delays or failed deliveries</li>
                <li>Payment verification problems</li>
                <li>Driver or vendor complaints</li>
                <li>Account access issues</li>
                <li>Refund-related questions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Safety Notice</h2>
              <p className="mt-3">
                If you suspect a gas leak or immediate safety hazard, contact emergency services
                or the relevant local emergency authority first before contacting platform support.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}