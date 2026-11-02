'use client'

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ArrowLeft, ExternalLink, LogIn } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';

type FavoriteItem = {
  id: string; // favorite ID or property ID
  propertyId: string;
  property: {
    id: string;
    slug: string;
    title: string;
    location?: string;
    price?: string | number;
    currency?: string;
    imageUrl?: string;
    propertyImages?: { imageUrl: string }[];
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
};

const formatPrice = (price: string | number | undefined, currency: string = 'RWF'): string => {
  if (!price) return 'Price on request';
  const num = Number(price);
  if (isNaN(num)) return String(price);
  if (num >= 1000000) {
    return `${currency} ${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${currency} ${(num / 1000).toFixed(0)}K`;
  }
  return `${currency} ${num.toLocaleString()}`;
};

export default function FavoritesContent() {
  const { isAuthenticated, user, userLogin, userRegister, logout } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auth Modal/Form toggles
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setMessage('');

    if (isAuthenticated && user?.id) {
      try {
        const result = (await api.getFavorites(user.id)) as { data: any[] };
        const rawFavorites = result.data || [];
        const formatted: FavoriteItem[] = rawFavorites.map((fav) => {
          const prop = fav.property || fav;
          return {
            id: fav.id || prop.id,
            propertyId: prop.id,
            property: {
              id: prop.id,
              slug: prop.slug,
              title: prop.title,
              location: prop.location,
              price: prop.price,
              currency: prop.currency || 'RWF',
              imageUrl: prop.propertyImages?.[0]?.imageUrl || prop.image,
              propertyType: prop.propertyType,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
            },
          };
        });
        setFavorites(formatted);
      } catch {
        setMessage('Failed to load saved properties.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Guest: load from favoriteIds
    if (favoriteIds.length > 0) {
      try {
        const fetched = await Promise.all(
          favoriteIds.slice(0, 20).map(async (id) => {
            try {
              // Try fetching property details
              const res = (await api.getProperty(id)) as { data: any };
              const p = res.data;
              return {
                id: p.id,
                propertyId: p.id,
                property: {
                  id: p.id,
                  slug: p.slug,
                  title: p.title,
                  location: p.location,
                  price: p.price,
                  currency: p.currency || 'RWF',
                  imageUrl: p.propertyImages?.[0]?.imageUrl || p.image,
                  propertyType: p.propertyType,
                  bedrooms: p.bedrooms,
                  bathrooms: p.bathrooms,
                },
              } as FavoriteItem;
            } catch {
              return null;
            }
          })
        );
        setFavorites(fetched.filter((item): item is FavoriteItem => item !== null));
      } catch {
        setMessage('Failed to load local saved properties.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setFavorites([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, favoriteIds]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (propertyId: string) => {
    await toggleFavorite(propertyId);
    setFavorites((prev) => prev.filter((fav) => fav.propertyId !== propertyId));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await userLogin(email, password);
      } else {
        await userRegister(name, email, password);
      }
      setShowAuthForm(false);
    } catch (err: any) {
      setMessage(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to properties
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">Favorite Properties</h1>
                <p className="text-sm text-slate-600">
                  {favorites.length === 0
                    ? 'You have not saved any properties yet.'
                    : `You have ${favorites.length} saved ${favorites.length === 1 ? 'property' : 'properties'}.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline">Signed in as {user?.email}</span>
                <button
                  onClick={logout}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthForm(!showAuthForm)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Auth Box for guests */}
        {showAuthForm && !isAuthenticated && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 max-w-md mx-auto mb-8 animate-in fade-in">
            <h2 className="text-xl font-bold text-brand-navy mb-2 text-center">
              {isLogin ? 'Sign In to Your Account' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 mb-4 text-center">
              Sign in to keep your favorite properties synced across all your devices.
            </p>
            <form onSubmit={handleAuth} className="flex flex-col gap-3">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Full Name"
                  className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-brand-emerald text-white p-3 rounded-lg font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            {message && <p className="text-xs text-red-600 text-center mt-3">{message}</p>}
            <p className="text-center text-xs text-slate-600 mt-4">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                className="text-brand-emerald font-bold hover:underline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage('');
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        )}

        {message && !showAuthForm && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
            {message}
          </div>
        )}

        {/* Grid or Empty State */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500">Loading saved properties...</div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-brand-navy mb-2">No Saved Properties Yet</h2>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
              Tap the heart icon on any property listing while browsing to save your favorite homes, apartments, or plots here.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-emerald text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-md text-sm"
            >
              Explore Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const p = fav.property;
              return (
                <article
                  key={fav.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col group"
                >
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        No image
                      </div>
                    )}

                    {/* Quick Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(fav.propertyId)}
                      aria-label="Remove from favorites"
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white text-rose-600 rounded-full flex items-center justify-center shadow-md transition-all backdrop-blur-sm"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-bold text-brand-navy text-lg mb-1 line-clamp-1">{p.title}</h2>
                      <p className="text-sm text-slate-500 mb-3">{p.location || 'Rwanda'}</p>
                      <p className="text-xl font-bold text-brand-emerald mb-4">
                        {formatPrice(p.price, p.currency)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        {p.bedrooms ? `${p.bedrooms} beds` : ''}{' '}
                        {p.bathrooms ? `· ${p.bathrooms} baths` : ''}
                      </div>

                      <Link
                        href={`/properties/${encodeURIComponent(p.id)}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
