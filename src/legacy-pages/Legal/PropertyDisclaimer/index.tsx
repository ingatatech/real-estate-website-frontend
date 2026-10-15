'use client'

export default function PropertyDisclaimer() {
  return (
    <main className="min-h-[50vh] bg-slate-50 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Property Disclaimers</h1>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">PROPERTY INFORMATION DISCLAIMER</h2>
          <p className="leading-relaxed text-slate-600">
            Property information displayed on this website is provided for general information and marketing purposes and may be subject to change. Property availability, prices, dimensions, features and other details should be independently confirmed with the company or authorized property representative before making any decision or transaction.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">PROPERTY LISTING DISCLAIMER</h2>
          <p className="leading-relaxed text-slate-600">
            Property listings may be provided by property owners, developers, agents or other authorized parties. The company shall take reasonable steps to maintain accurate listing information, but visitors should independently verify relevant property details before entering into a transaction.
          </p>
        </section>

        <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">
            <strong>Note:</strong> The final wording shall be reviewed and approved by the company.
          </p>
        </div>
      </div>
    </main>
  )
}
