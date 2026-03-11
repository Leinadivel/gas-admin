export default function DeliveryPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Delivery Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">Last updated: March 2026</p>
            <p className="mt-4 text-base leading-7 text-gray-600">
              This Delivery Policy explains how deliveries are handled on the{' '}
              <span className="font-semibold text-gray-900">24hrsGas</span> platform.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-gray-700 sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">1. Delivery Coverage</h2>
              <p className="mt-3">
                Delivery is available only in supported service areas where vendors and drivers are
                active on the 24hrsGas platform. Availability may vary by location and demand.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">2. Delivery Fees</h2>
              <p className="mt-3">
                Delivery fees are calculated based on delivery distance, applicable pricing rules,
                gas quantity, and platform charges. The final amount is displayed before order
                completion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">3. Delivery Time</h2>
              <p className="mt-3">
                Estimated delivery time depends on vendor availability, driver availability,
                traffic conditions, and delivery distance. Estimated times shown in the app are
                approximate and may vary.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">4. Customer Responsibility</h2>
              <p className="mt-3">
                Customers must provide a correct and accessible delivery address and ensure someone
                is available to receive the order where required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">5. Failed Deliveries</h2>
              <p className="mt-3">A delivery may fail if:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>The address is incorrect or inaccessible</li>
                <li>The customer is unavailable</li>
                <li>There is a verified safety concern at the location</li>
                <li>The order cannot be completed due to external conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">6. Safety Rules</h2>
              <p className="mt-3">
                Customers and drivers must handle all gas-related deliveries with care. Gas
                cylinders should be kept away from open flames, unsafe handling conditions, and
                any environment that may create a safety risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">7. Order Tracking</h2>
              <p className="mt-3">
                Customers may receive order status updates and delivery tracking information through
                the app where available.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">8. Cancellations and Refunds</h2>
              <p className="mt-3">
                Orders may be cancelled before fulfillment under permitted platform conditions.
                Refunds, where applicable, are processed according to the payment method used and
                the result of order verification.
              </p>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-xl font-semibold text-gray-900">9. Contact Support</h2>
              <p className="mt-3">
                For delivery-related issues, please contact:
              </p>
              <p className="mt-3 font-semibold text-gray-900">support@24hrsgas.com</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}