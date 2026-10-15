import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          
          {/* Brand & Intro */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h4 className="text-white text-xl font-bold mb-4">Ingata Real Estate</h4>
            <p className="text-sm text-slate-400 mb-4">
              Rwanda's premier real estate platform. Discover, buy, rent, and manage property with confidence.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" href="/about/our-company">About Us</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/our-team">Our Team</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/about/why-choose-us">Why Choose Us</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Properties */}
          <div>
            <h4 className="text-white font-semibold mb-4">Properties</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" href="/properties?transactionType=SALE">Properties for Sale</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/properties?transactionType=RENT">Properties for Rent</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/properties?propertyType=RESIDENTIAL">Residential</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/properties?propertyType=COMMERCIAL">Commercial</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/properties?propertyType=LAND">Land</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/properties?isNewDevelopment=true">New Developments</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" href="/services/property-sales">Property Sales</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/services/property-rentals">Property Rentals</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/services/property-management">Property Management</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/services/property-marketing">Property Marketing</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/services/property-valuation">Property Valuation</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/services/real-estate-advisory">Real Estate Advisory</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" href="/faqs">FAQs</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/insights/articles">Articles</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/insights/property-guides">Property Guides</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/insights/news">News</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white transition-colors" href="/legal/privacy-policy">Privacy Policy</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/legal/terms-and-conditions">Terms & Conditions</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/legal/property-disclaimer">Disclaimer</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/legal/cookie-policy">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h5 className="text-white font-semibold mb-1">Telephone</h5>
                <a href="tel:+250796593119" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">+250 796 593 119</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h5 className="text-white font-semibold mb-1">Email</h5>
                <a href="mailto:ingatatechnologiesltd@gmail.com" className="text-slate-300 hover:text-emerald-400 transition-colors text-sm">ingatatechnologiesltd@gmail.com</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h5 className="text-white font-semibold mb-1">Address</h5>
                <p className="text-slate-300 text-sm">KG 11 Ave, Zindiro, AZAM Rond Point, Gasabo-Kigali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Ingata Real Estate. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/legal/terms-and-conditions" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/legal/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;