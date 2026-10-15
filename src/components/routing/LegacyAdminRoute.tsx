import type { ComponentType } from 'react'
import { notFound } from 'next/navigation'
import { AdminLayout } from '@/components/layout/AdminLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Articles from '@/legacy-pages/Admin/Articles'
import NewArticle from '@/legacy-pages/Admin/Articles/NewArticle'
import EditArticle from '@/legacy-pages/Admin/Articles/EditArticle'
import Categories from '@/legacy-pages/Admin/Categories'
import NewCategory from '@/legacy-pages/Admin/Categories/NewCategory'
import EditCategory from '@/legacy-pages/Admin/Categories/EditCategory'
import FAQs from '@/legacy-pages/Admin/FAQs'
import NewFAQ from '@/legacy-pages/Admin/FAQs/NewFAQ'
import EditFAQ from '@/legacy-pages/Admin/FAQs/EditFAQ'
import Inquiries from '@/legacy-pages/Admin/Inquiries'
import ListingRequests from '@/legacy-pages/Admin/ListingRequests'
import Properties from '@/legacy-pages/Admin/Properties'
import NewProperty from '@/legacy-pages/Admin/Properties/NewProperty'
import EditProperty from '@/legacy-pages/Admin/Properties/EditProperty'
import Services from '@/legacy-pages/Admin/Services'
import NewService from '@/legacy-pages/Admin/Services/NewService'
import EditService from '@/legacy-pages/Admin/Services/EditService'
import Testimonials from '@/legacy-pages/Admin/Testimonials'
import NewTestimonial from '@/legacy-pages/Admin/Testimonials/NewTestimonial'
import EditTestimonial from '@/legacy-pages/Admin/Testimonials/EditTestimonial'
import Users from '@/legacy-pages/Admin/Users'
import Valuations from '@/legacy-pages/Admin/Valuations'
import Viewings from '@/legacy-pages/Admin/Viewings'
import Settings from '@/legacy-pages/Admin/Settings'
import Analytics from '@/legacy-pages/Admin/Analytics'
import ContactMessages from '@/legacy-pages/Admin/Contact'
import { RouteParamsProvider } from '@/navigation/legacy-router'

const staticRoutes: Record<string, ComponentType> = {
  analytics: Analytics,
  articles: Articles,
  categories: Categories,
  contact: ContactMessages,
  'contact-messages': ContactMessages,
  faqs: FAQs,
  inquiries: Inquiries,
  listings: ListingRequests,
  properties: Properties,
  services: Services,
  settings: Settings,
  testimonials: Testimonials,
  users: Users,
  valuations: Valuations,
  viewings: Viewings,
}

const createRoutes: Record<string, ComponentType> = {
  'articles/new': NewArticle,
  'categories/new': NewCategory,
  'properties/new': NewProperty,
  'services/new': NewService,
  'testimonials/new': NewTestimonial,
  'faqs/new': NewFAQ,
}

const editRoutes: Record<string, ComponentType> = {
  articles: EditArticle,
  categories: EditCategory,
  properties: EditProperty,
  services: EditService,
  testimonials: EditTestimonial,
  faqs: EditFAQ,
}

export function LegacyAdminRoute({ segments }: { segments: string[] }) {
  const path = segments.join('/')
  const Page = staticRoutes[path] || createRoutes[path]

  if (Page) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <Page />
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (segments.length === 3 && segments[2] === 'edit') {
    const EditPage = editRoutes[segments[0]]
    if (EditPage) {
      return (
        <ProtectedRoute>
          <AdminLayout>
            <RouteParamsProvider params={{ id: segments[1] }}>
              <EditPage />
            </RouteParamsProvider>
          </AdminLayout>
        </ProtectedRoute>
      )
    }
  }

  notFound()
}
