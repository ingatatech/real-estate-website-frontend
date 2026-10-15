'use client'

import React, { useState } from 'react';
import { NavLink, useNavigate } from '@/navigation/legacy-router';
import {
  Building2,
  LayoutDashboard,
  Home,
  Tag,
  Users,
  ClipboardList,
  MessageSquare,
  Calendar,
  TrendingUp,
  FileText,
  HelpCircle,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  BarChart3,
  Briefcase,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/properties', icon: Home, label: 'Properties' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/listings', icon: ClipboardList, label: 'Property Requests' },
  { to: '/admin/inquiries', icon: MessageSquare, label: 'Inquiries' },
  { to: '/admin/contact', icon: Mail, label: 'Contact Messages' },
  { to: '/admin/viewings', icon: Calendar, label: 'Viewings' },
  { to: '/admin/valuations', icon: TrendingUp, label: 'Valuations' },
  { to: '/admin/services', icon: Briefcase, label: 'Services' },
  { to: '/admin/articles', icon: FileText, label: 'Articles' },
  { to: '/admin/faqs', icon: HelpCircle, label: 'FAQs' },
  { to: '/admin/testimonials', icon: Star, label: 'Testimonials' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-700/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-white text-base">Ingata</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</p>
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="flex-shrink-0 border-t border-slate-700/60 p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 mb-1">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop Sidebar — always visible */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-slate-700/40 shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-72 shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition text-slate-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-800">Admin Portal</p>
              <p className="text-xs text-slate-400">Ingata Real Estate</p>
            </div>
            <div className="w-9 h-9 bg-emerald-500/15 rounded-full flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
