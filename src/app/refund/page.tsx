export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Refund Policy
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last updated: March 2026
            </p>

            <p className="mt-4 text-base leading-7 text-gray-600">
              This Refund Policy explains how refunds are handled on the{" "}
              <span className="font-semibold text-gray-900">24hrsGas</span>{" "}
              platform for gas refill deliveries and related purchases.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-gray-700 sm:text-base">

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                1. When Refunds May Apply
              </h2>
              <p className="mt-3">
                Refunds may be issued under certain circumstances, including:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Payment was successfully processed but the order was not fulfilled.</li>
                <li>The vendor was unable to complete the delivery.</li>
                <li>The order was cancelled before delivery was dispatched.</li>
                <li>Duplicate payments or billing errors occurred.</li>
                <li>A verified platform or payment processing issue occurred.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                2. Non-Refundable Situations
              </h2>
              <p className="mt-3">
                Refunds may not be issued in situations including:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>The order was successfully delivered and completed.</li>
                <li>The customer provided an incorrect or unreachable delivery location.</li>
                <li>The customer cancelled after the delivery driver had already been dispatched.</li>
                <li>The issue arises from misuse of gas products after delivery.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                3. Refund Processing Time
              </h2>
              <p className="mt-3">
                Approved refunds are typically processed within{" "}
                <span className="font-semibold">3–7 business days</span>,
                depending on the payment provider and banking system used.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                4. Payment Method Refunds
              </h2>
              <p className="mt-3">
                Refunds will be returned to the original payment method used
                for the transaction whenever possible. If this is not possible,
                the platform may provide an alternative resolution in accordance
                with payment provider rules.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                5. Order Disputes
              </h2>
              <p className="mt-3">
                If you believe a refund is required due to an issue with your
                order, please contact our support team with your order
                reference, payment details, and a description of the issue so
                it can be investigated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                6. Platform Review
              </h2>
              <p className="mt-3">
                24hrsGas reserves the right to review all refund requests and
                determine eligibility based on transaction records, delivery
                status, vendor reports, and platform logs.
              </p>
            </section>

            <section className="rounded-2xl bg-gray-50 p-5">
              <h2 className="text-xl font-semibold text-gray-900">
                7. Contact Support
              </h2>
              <p className="mt-3">
                If you need assistance with a refund request, please contact:
              </p>

              <p className="mt-3 font-semibold text-gray-900">
                support@24hrsgas.com
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}