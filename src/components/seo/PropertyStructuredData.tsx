interface PropertyStructuredDataProps {
  property: {
    id?: string
    title: string
    description?: string | null
    price?: string | number | null
    currency?: string | null
    location?: string | null
    address?: string | null
    district?: string | null
    sector?: string | null
    neighborhood?: string | null
    propertyType: string
    transactionType: string
    bedrooms?: number | null
    bathrooms?: number | null
    size?: string | number | null
    sizeUnit?: string | null
    propertyImages?: { imageUrl: string; isPrimary?: boolean }[]
    latitude?: number | null
    longitude?: number | null
    url?: string
  }
}

export function PropertyStructuredData({ property }: PropertyStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ingata-real-estate.com'
  const propertyUrl = property.url || (property.id ? `${baseUrl}/properties/${encodeURIComponent(property.id)}` : `${baseUrl}/properties`)

  const primaryImage = property.propertyImages?.find((img) => img.isPrimary)?.imageUrl || property.propertyImages?.[0]?.imageUrl

  const mapPropertyTypeToSchema = (type: string) => {
    const typeMap: Record<string, string> = {
      RESIDENTIAL: 'Residence',
      APARTMENTS: 'Apartment',
      HOUSES: 'House',
      VILLA: 'House',
      LAND: 'Land',
      COMMERCIAL: 'Commercial',
      OFFICES: 'Office',
      WAREHOUSES: 'Warehouse',
    }
    return typeMap[type] || 'SingleFamilyResidence'
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': mapPropertyTypeToSchema(property.propertyType),
    name: property.title,
    description: property.description || `${property.transactionType} ${property.propertyType} in ${property.location || 'Rwanda'}`,
    url: propertyUrl,
    image: primaryImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || undefined,
      addressLocality: property.sector || property.neighborhood || undefined,
      addressRegion: property.district || undefined,
      addressCountry: 'RW',
    },
    geo: property.latitude && property.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: property.latitude,
          longitude: property.longitude,
        }
      : undefined,
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: property.size
      ? {
          '@type': 'QuantitativeValue',
          value: property.size,
          unitCode: property.sizeUnit === 'sqm' ? 'MTK' : property.sizeUnit === 'sqft' ? 'FTK' : 'MTK',
        }
      : undefined,
    price: property.price
      ? {
          '@type': 'PriceSpecification',
          price: typeof property.price === 'number' ? property.price : parseFloat(property.price.toString()),
          priceCurrency: property.currency || 'RWF',
        }
      : undefined,
    offers: property.price
      ? {
          '@type': 'Offer',
          price: typeof property.price === 'number' ? property.price : parseFloat(property.price.toString()),
          priceCurrency: property.currency || 'RWF',
          availability: property.transactionType === 'SALE' ? 'https://schema.org/InStock' : 'https://schema.org/InStock',
          url: propertyUrl,
        }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2),
      }}
    />
  )
}
