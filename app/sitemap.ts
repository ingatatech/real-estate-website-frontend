import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ingata-real-estate.com'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/property-search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/our-company`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/mission`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/list-your-property`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/our-team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Add property category pages
  const categories = [
    'apartments',
    'commercial',
    'for-lease',
    'for-rent',
    'for-sale',
    'houses',
    'land',
    'new-developments',
    'offices',
    'residential',
    'warehouses',
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/properties/${category}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // Fetch dynamic property pages from backend
  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${apiUrl}/properties?limit=1000&status=AVAILABLE`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (response.ok) {
      const data = await response.json()
      const properties = data.data || []

      propertyPages = properties.map((property: any) => ({
        url: `${baseUrl}/properties/${property.id}`,
        lastModified: property.updatedAt ? new Date(property.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching properties for sitemap:', error)
  }

  // Fetch dynamic pages from backend
  let dynamicPages: MetadataRoute.Sitemap = []
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${apiUrl}/pages`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (response.ok) {
      const data = await response.json()
      const pages = data.data || []

      dynamicPages = pages
        .filter((page: any) => page.isPublished)
        .map((page: any) => ({
          url: `${baseUrl}/${page.slug}`,
          lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
    }
  } catch (error) {
    console.error('Error fetching pages for sitemap:', error)
  }

  return [...staticPages, ...categoryPages, ...propertyPages, ...dynamicPages]
}
