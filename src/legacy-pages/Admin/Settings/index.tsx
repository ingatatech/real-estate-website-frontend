'use client'

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  AlertCircle,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  Share2,
  Building2,
  User,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { adminApi } from '../../../services/api';

interface ContactSettings {
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutCtaText: string;
  aboutCtaLink: string;
  servicesTitle: string;
  servicesDescription: string;
  showFeaturedSection: boolean;
  featuredSectionTitle: string;
  showServicesSection: boolean;
  showAboutSection: boolean;
}

interface SystemSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
}

interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  enableTwoFactor: boolean;
}

interface AllSettings {
  contact: ContactSettings;
  homepage: HomepageSettings;
  system: SystemSettings;
  security: SecuritySettings;
}

const mergeSavedSettings = (saved: Record<string, unknown>, defaults: AllSettings): AllSettings => ({
  contact: {
    ...defaults.contact,
    phone: typeof saved.phone === 'string' ? saved.phone : defaults.contact.phone,
    email: typeof saved.email === 'string' ? saved.email : defaults.contact.email,
    whatsapp: typeof saved.whatsapp === 'string' ? saved.whatsapp : defaults.contact.whatsapp,
    address: typeof saved.address === 'string' ? saved.address : defaults.contact.address,
    facebook: typeof saved.facebookUrl === 'string' ? saved.facebookUrl : defaults.contact.facebook,
    twitter: typeof saved.xUrl === 'string' ? saved.xUrl : defaults.contact.twitter,
    instagram: typeof saved.instagramUrl === 'string' ? saved.instagramUrl : defaults.contact.instagram,
    linkedin: typeof saved.linkedinUrl === 'string' ? saved.linkedinUrl : defaults.contact.linkedin,
  },
  homepage: {
    ...defaults.homepage,
    heroTitle: typeof saved.heroTitle === 'string' ? saved.heroTitle : defaults.homepage.heroTitle,
    heroSubtitle: typeof saved.heroSubtitle === 'string' ? saved.heroSubtitle : defaults.homepage.heroSubtitle,
    heroCtaText: typeof saved.heroCtaText === 'string' ? saved.heroCtaText : defaults.homepage.heroCtaText,
    heroCtaLink: typeof saved.heroCtaLink === 'string' ? saved.heroCtaLink : defaults.homepage.heroCtaLink,
    aboutTitle: typeof saved.aboutTitle === 'string' ? saved.aboutTitle : defaults.homepage.aboutTitle,
    aboutDescription: typeof saved.aboutDescription === 'string' ? saved.aboutDescription : defaults.homepage.aboutDescription,
    aboutCtaText: typeof saved.aboutCtaText === 'string' ? saved.aboutCtaText : defaults.homepage.aboutCtaText,
    aboutCtaLink: typeof saved.aboutCtaLink === 'string' ? saved.aboutCtaLink : defaults.homepage.aboutCtaLink,
    servicesTitle: typeof saved.servicesTitle === 'string' ? saved.servicesTitle : defaults.homepage.servicesTitle,
    servicesDescription: typeof saved.servicesDescription === 'string' ? saved.servicesDescription : defaults.homepage.servicesDescription,
    featuredSectionTitle: typeof saved.featuredSectionTitle === 'string' ? saved.featuredSectionTitle : defaults.homepage.featuredSectionTitle,
    showFeaturedSection: typeof saved.showFeaturedSection === 'boolean' ? saved.showFeaturedSection : defaults.homepage.showFeaturedSection,
    showServicesSection: typeof saved.showServicesSection === 'boolean' ? saved.showServicesSection : defaults.homepage.showServicesSection,
    showAboutSection: typeof saved.showAboutSection === 'boolean' ? saved.showAboutSection : defaults.homepage.showAboutSection,
  },
  system: {
    ...defaults.system,
    siteName: typeof saved.siteName === 'string' ? saved.siteName : defaults.system.siteName,
    logoUrl: typeof saved.logoUrl === 'string' ? saved.logoUrl : defaults.system.logoUrl,
    faviconUrl: typeof saved.faviconUrl === 'string' ? saved.faviconUrl : defaults.system.faviconUrl,
  },
  security: {
    ...defaults.security,
    sessionTimeout: typeof saved.sessionTimeout === 'number' ? saved.sessionTimeout : defaults.security.sessionTimeout,
    maxLoginAttempts: typeof saved.maxLoginAttempts === 'number' ? saved.maxLoginAttempts : defaults.security.maxLoginAttempts,
    passwordRequireUppercase: typeof saved.passwordRequireUppercase === 'boolean' ? saved.passwordRequireUppercase : defaults.security.passwordRequireUppercase,
    passwordRequireLowercase: typeof saved.passwordRequireLowercase === 'boolean' ? saved.passwordRequireLowercase : defaults.security.passwordRequireLowercase,
    passwordRequireNumbers: typeof saved.passwordRequireNumbers === 'boolean' ? saved.passwordRequireNumbers : defaults.security.passwordRequireNumbers,
    passwordRequireSpecialChars: typeof saved.passwordRequireSpecialChars === 'boolean' ? saved.passwordRequireSpecialChars : defaults.security.passwordRequireSpecialChars,
    enableTwoFactor: typeof saved.enableTwoFactor === 'boolean' ? saved.enableTwoFactor : defaults.security.enableTwoFactor,
  },
});

export default function Settings() {
  const [settings, setSettings] = useState<AllSettings>({
    contact: {
      phone: '+250 796 593 119',
      email: 'ingatatechnologiesltd@gmail.com',
      whatsapp: '+250796593119',
      address: 'KG 11 Ave, Zindiro, AZAM Rond Point, Gasabo-Kigali',
      facebook: 'https://facebook.com',
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
    },
    homepage: {
      heroTitle: 'Find a Place to Call Home',
      heroSubtitle: 'Discover residential, commercial and investment properties that match your needs and goals.',
      heroCtaText: 'Explore Properties',
      heroCtaLink: '/properties',
      aboutTitle: 'About Ingata Real Estate',
      aboutDescription: 'Ingata Real Estate is a real estate company providing property sales, rentals, property management, marketing and related real estate services.',
      aboutCtaText: 'Learn More About Us',
      aboutCtaLink: '/about/our-company',
      servicesTitle: 'Our Services',
      servicesDescription: 'Comprehensive real estate solutions tailored for you.',
      showFeaturedSection: true,
      featuredSectionTitle: 'Featured Properties',
      showServicesSection: true,
      showAboutSection: true,
    },
    system: {
      siteName: 'Ingata Real Estate',
      logoUrl: '',
      faviconUrl: '',
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      enableTwoFactor: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'contact' | 'homepage' | 'system' | 'security'>('contact');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSettings();
      const result = response as { success: boolean; data: Record<string, unknown> };
      if (result.success && result.data) {
        setSettings((current) => mergeSavedSettings(result.data, current));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await adminApi.updateSettings({
        siteName: settings.system.siteName,
        logoUrl: settings.system.logoUrl,
        faviconUrl: settings.system.faviconUrl,
        email: settings.contact.email,
        phone: settings.contact.phone,
        whatsapp: settings.contact.whatsapp,
        address: settings.contact.address,
        facebookUrl: settings.contact.facebook,
        xUrl: settings.contact.twitter,
        instagramUrl: settings.contact.instagram,
        linkedinUrl: settings.contact.linkedin,
        heroTitle: settings.homepage.heroTitle,
        heroSubtitle: settings.homepage.heroSubtitle,
        heroCtaText: settings.homepage.heroCtaText,
        heroCtaLink: settings.homepage.heroCtaLink,
        aboutTitle: settings.homepage.aboutTitle,
        aboutDescription: settings.homepage.aboutDescription,
        aboutCtaText: settings.homepage.aboutCtaText,
        aboutCtaLink: settings.homepage.aboutCtaLink,
        servicesTitle: settings.homepage.servicesTitle,
        servicesDescription: settings.homepage.servicesDescription,
        featuredSectionTitle: settings.homepage.featuredSectionTitle,
        showFeaturedSection: settings.homepage.showFeaturedSection,
        showServicesSection: settings.homepage.showServicesSection,
        showAboutSection: settings.homepage.showAboutSection,
      });
      if ((response as { success: boolean }).success) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContactChange = (field: keyof ContactSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const handleHomepageChange = (field: keyof HomepageSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      homepage: { ...prev.homepage, [field]: value }
    }));
  };

  const handleSystemChange = (field: keyof SystemSettings, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      system: { ...prev.system, [field]: value }
    }));
  };

  const handleSecurityChange = (field: keyof SecuritySettings, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }));
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage contact information and homepage content.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Contact Information
          </button>
          <button
            onClick={() => setActiveTab('homepage')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'homepage'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Homepage Content
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            System Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Security Settings
          </button>
        </nav>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="rounded p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <span className="text-sm font-medium">{message}</span>
          <button
            type="button"
            onClick={() => setMessage('')}
            className="ml-auto rounded p-1 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Contact Settings Tab */}
      {activeTab === 'contact' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Contact Information</h2>
            <p className="text-sm text-slate-500">
              Update the company's contact details displayed on the website.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={settings.contact.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={settings.contact.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={settings.contact.whatsapp}
                    onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Office Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={settings.contact.address}
                    onChange={(e) => handleContactChange('address', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Full office address"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Facebook
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="url"
                      value={settings.contact.facebook}
                      onChange={(e) => handleContactChange('facebook', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="https://facebook.com/pagename"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Twitter
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="url"
                      value={settings.contact.twitter}
                      onChange={(e) => handleContactChange('twitter', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="https://twitter.com/handle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Instagram
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="url"
                      value={settings.contact.instagram}
                      onChange={(e) => handleContactChange('instagram', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="https://instagram.com/handle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="url"
                      value={settings.contact.linkedin}
                      onChange={(e) => handleContactChange('linkedin', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="https://linkedin.com/company/pagename"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homepage Settings Tab */}
      {activeTab === 'homepage' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Homepage Content</h2>
            <p className="text-sm text-slate-500">
              Customize the homepage hero section and content blocks.
            </p>
          </div>

          <div className="space-y-6">
            {/* Hero Section */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Hero Section
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={settings.homepage.heroTitle}
                    onChange={(e) => handleHomepageChange('heroTitle', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Main headline"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hero Subtitle
                  </label>
                  <textarea
                    value={settings.homepage.heroSubtitle}
                    onChange={(e) => handleHomepageChange('heroSubtitle', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Supporting text"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.heroCtaText}
                      onChange={(e) => handleHomepageChange('heroCtaText', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Button text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CTA Button Link
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.heroCtaLink}
                      onChange={(e) => handleHomepageChange('heroCtaLink', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="/properties"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                About Section
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={settings.homepage.aboutTitle}
                    onChange={(e) => handleHomepageChange('aboutTitle', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="About section heading"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.homepage.aboutDescription}
                    onChange={(e) => handleHomepageChange('aboutDescription', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Brief company description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CTA Text
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.aboutCtaText}
                      onChange={(e) => handleHomepageChange('aboutCtaText', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Learn More About Us"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CTA Link
                    </label>
                    <input
                      type="text"
                      value={settings.homepage.aboutCtaLink}
                      onChange={(e) => handleHomepageChange('aboutCtaLink', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="/about/our-company"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAboutSection"
                    checked={settings.homepage.showAboutSection}
                    onChange={(e) => handleHomepageChange('showAboutSection', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:ring-offset-2"
                  />
                  <label htmlFor="showAboutSection" className="text-sm text-slate-700">
                    Show About Section on Homepage
                  </label>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Services Section
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={settings.homepage.servicesTitle}
                    onChange={(e) => handleHomepageChange('servicesTitle', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Our Services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.homepage.servicesDescription}
                    onChange={(e) => handleHomepageChange('servicesDescription', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Brief services description"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showServicesSection"
                    checked={settings.homepage.showServicesSection}
                    onChange={(e) => handleHomepageChange('showServicesSection', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:ring-offset-2"
                  />
                  <label htmlFor="showServicesSection" className="text-sm text-slate-700">
                    Show Services Section on Homepage
                  </label>
                </div>
              </div>
            </div>

            {/* Featured Section */}
            <div>
              <h3 className="text font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                Featured Properties Section
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={settings.homepage.featuredSectionTitle}
                    onChange={(e) => handleHomepageChange('featuredSectionTitle', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Featured Properties"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showFeaturedSection"
                    checked={settings.homepage.showFeaturedSection}
                    onChange={(e) => handleHomepageChange('showFeaturedSection', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:ring-offset-2"
                  />
                  <label htmlFor="showFeaturedSection" className="text-sm text-slate-700">
                    Show Featured Properties Section on Homepage
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">System Settings</h2>
            <p className="text-sm text-slate-500">
              Configure basic site settings and preferences.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.system.siteName}
                  onChange={(e) => handleSystemChange('siteName', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={settings.system.logoUrl}
                  onChange={(e) => handleSystemChange('logoUrl', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Favicon URL
                </label>
                <input
                  type="url"
                  value={settings.system.faviconUrl}
                  onChange={(e) => handleSystemChange('faviconUrl', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Security Settings</h2>
            <p className="text-sm text-slate-500">
              Configure security and authentication settings.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', Number(e.target.value))}
                min="5"
                max="1440"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleSecurityChange('maxLoginAttempts', Number(e.target.value))}
                min="3"
                max="10"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.passwordRequireUppercase}
                  onChange={(e) => handleSecurityChange('passwordRequireUppercase', e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Require Uppercase Letters</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.passwordRequireLowercase}
                  onChange={(e) => handleSecurityChange('passwordRequireLowercase', e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Require Lowercase Letters</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.passwordRequireNumbers}
                  onChange={(e) => handleSecurityChange('passwordRequireNumbers', e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Require Numbers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.passwordRequireSpecialChars}
                  onChange={(e) => handleSecurityChange('passwordRequireSpecialChars', e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Require Special Characters</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.enableTwoFactor}
                  onChange={(e) => handleSecurityChange('enableTwoFactor', e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Enable Two-Factor Authentication</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
