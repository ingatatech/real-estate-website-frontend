import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PropertyDetails from '@/components/content/PropertyDetails'
import { generatePropertyMetadata } from '@/utils/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  // Fetch property data for dynamic metadata
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${apiUrl}/properties/id/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    })

    if (response.ok) {
      const data = await response.json()
      const property = data.data

      if (property) {
        const primaryImage = property.propertyImages?.find((img: any) => img.isPrimary)?.imageUrl || property.propertyImages?.[0]?.imageUrl

        return generatePropertyMetadata({
          title: property.title,
          description: property.description,
          imageUrl: primaryImage,
          price: property.price,
          location: property.location || property.district,
          propertyType: property.propertyType,
          transactionType: property.transactionType,
          slug: property.id,
        })
      }
    }
  } catch (error) {
    console.error('Error fetching property for metadata:', error)
  }

  // Fallback metadata
  return {
    title: 'Property Details | Ingata Real Estate',
    description: 'View property details on Ingata Real Estate.',
  }
}

async function propertyExists(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${apiUrl}/properties/id/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    })
    return response.status !== 404 && response.ok
  } catch {
    return true
  }
}

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!id) notFound()
  if (!(await propertyExists(id))) notFound()

  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-16 text-slate-500">Loading property…</main>}>
      <PropertyDetails propertyId={id} />
    </Suspense>
  )
}
