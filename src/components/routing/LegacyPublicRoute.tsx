import type { ComponentType } from 'react'
import { notFound } from 'next/navigation'
import CoreValues from '@/legacy-pages/About/CoreValues'
import Mission from '@/legacy-pages/About/Mission'
import OurCompany from '@/legacy-pages/About/OurCompany'
import Vision from '@/legacy-pages/About/Vision'
import WhyChooseUs from '@/legacy-pages/About/WhyChooseUs'
import Agents from '@/legacy-pages/Agents'
import AgentProfile from '@/legacy-pages/AgentProfile'
import ContactUs from '@/legacy-pages/ContactUs'
import CompareProperties from '@/legacy-pages/CustomerTools/CompareProperties'
import Favorites from '@/legacy-pages/CustomerTools/Favorites'
import MortgageCalculator from '@/legacy-pages/CustomerTools/MortgageCalculator'
import RentalYieldCalculator from '@/legacy-pages/CustomerTools/RentalYieldCalculator'
import FAQs from '@/legacy-pages/FAQs'
import News from '@/legacy-pages/Insights/News'
import Articles from '@/legacy-pages/Insights/Articles'
import PropertyGuides from '@/legacy-pages/Insights/PropertyGuides'
import CookiePolicy from '@/legacy-pages/Legal/CookiePolicy'
import PrivacyPolicy from '@/legacy-pages/Legal/PrivacyPolicy'
import PropertyDisclaimer from '@/legacy-pages/Legal/PropertyDisclaimer'
import TermsAndConditions from '@/legacy-pages/Legal/TermsAndConditions'
import PropertyValuationRequest from '@/legacy-pages/PropertyValuationRequest'
import RequestViewing from '@/legacy-pages/RequestViewing'
import Apartments from '@/legacy-pages/Properties/Apartments'
import Commercial from '@/legacy-pages/Properties/Commercial'
import ForLease from '@/legacy-pages/Properties/ForLease'
import ForRent from '@/legacy-pages/Properties/ForRent'
import ForSale from '@/legacy-pages/Properties/ForSale'
import Houses from '@/legacy-pages/Properties/Houses'
import Land from '@/legacy-pages/Properties/Land'
import NewDevelopments from '@/legacy-pages/Properties/NewDevelopments'
import Offices from '@/legacy-pages/Properties/Offices'
import Residential from '@/legacy-pages/Properties/Residential'
import Warehouses from '@/legacy-pages/Properties/Warehouses'
import PropertyDevelopmentMarketing from '@/legacy-pages/Services/PropertyDevelopmentMarketing'
import PropertyLeasing from '@/legacy-pages/Services/PropertyLeasing'
import PropertyManagement from '@/legacy-pages/Services/PropertyManagement'
import PropertyMarketing from '@/legacy-pages/Services/PropertyMarketing'
import PropertyRentals from '@/legacy-pages/Services/PropertyRentals'
import PropertySales from '@/legacy-pages/Services/PropertySales'
import PropertySearchServices from '@/legacy-pages/Services/PropertySearchServices'
import PropertyValuation from '@/legacy-pages/Services/PropertyValuation'
import RealEstateAdvisory from '@/legacy-pages/Services/RealEstateAdvisory'
import RealEstateConsultancy from '@/legacy-pages/Services/RealEstateConsultancy'
import { RouteParamsProvider } from '@/navigation/legacy-router'
import ArticleDetails from '@/components/content/ArticleDetails'

const staticRoutes: Record<string, ComponentType> = {
  '/about/core-values': CoreValues,
  '/about/mission': Mission,
  '/about/our-company': OurCompany,
  '/about/vision': Vision,
  '/about/why-choose-us': WhyChooseUs,
  '/agents': Agents,
  '/contact-us': ContactUs,
  '/compare-properties': CompareProperties,
  '/cookie-policy': CookiePolicy,
  '/faqs': FAQs,
  '/favorites': Favorites,
  '/insights/articles': Articles,
  '/insights/news': News,
  '/insights/property-guides': PropertyGuides,
  '/legal/cookie-policy': CookiePolicy,
  '/legal/privacy-policy': PrivacyPolicy,
  '/legal/property-disclaimer': PropertyDisclaimer,
  '/legal/property-listing-disclaimer': PropertyDisclaimer,
  '/legal/terms-and-conditions': TermsAndConditions,
  '/mortgage-calculator': MortgageCalculator,
  '/privacy-policy': PrivacyPolicy,
  '/properties/apartments': Apartments,
  '/properties/commercial': Commercial,
  '/properties/for-lease': ForLease,
  '/properties/for-rent': ForRent,
  '/properties/for-sale': ForSale,
  '/properties/houses': Houses,
  '/properties/land': Land,
  '/properties/new-developments': NewDevelopments,
  '/properties/offices': Offices,
  '/properties/residential': Residential,
  '/properties/warehouses': Warehouses,
  '/property-disclaimer': PropertyDisclaimer,
  '/property-valuation': PropertyValuationRequest,
  '/rental-yield-calculator': RentalYieldCalculator,
  '/request-viewing': RequestViewing,
  '/services/property-development-marketing': PropertyDevelopmentMarketing,
  '/services/property-leasing': PropertyLeasing,
  '/services/property-management': PropertyManagement,
  '/services/property-marketing': PropertyMarketing,
  '/services/property-rentals': PropertyRentals,
  '/services/property-sales': PropertySales,
  '/services/property-search-services': PropertySearchServices,
  '/services/property-valuation': PropertyValuation,
  '/services/real-estate-advisory': RealEstateAdvisory,
  '/services/real-estate-consultancy': RealEstateConsultancy,
  '/terms-and-conditions': TermsAndConditions,
}

export function LegacyPublicRoute({ segments }: { segments: string[] }) {
  const path = `/${segments.join('/')}`
  const Page = staticRoutes[path]

  if (Page) return <Page />

  if (segments.length === 3 && segments[0] === 'insights' && segments[1] === 'articles') {
    return <ArticleDetails slug={segments[2]} />
  }

  if (segments.length === 2 && segments[0] === 'agents') {
    return (
      <RouteParamsProvider params={{ agentName: segments[1] }}>
        <AgentProfile />
      </RouteParamsProvider>
    )
  }

  notFound()
}
