import Link from 'next/link'

export default function PropertyNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-emerald">Property unavailable</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-navy">Property not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        The property ID is invalid or the property is no longer available.
      </p>
      <Link href="/properties" className="mt-6 rounded-lg bg-brand-emerald px-5 py-3 font-semibold text-white">
        Browse properties
      </Link>
    </main>
  )
}
