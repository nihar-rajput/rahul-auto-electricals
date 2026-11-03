import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Menu, X, Shield, Phone, ShoppingBag } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WebsiteSettings } from '../types';

interface NavbarProps {
  settings?: WebsiteSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({ settings }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const businessPhone = settings?.business_phone || '+91 98765 43210';

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/batteries', label: t('nav.batteries') },
    { to: '/request-battery', label: t('nav.requestBattery') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-subtle">
      {/* Top micro-bar for direct contact & business trust */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-200">
              {t('hero.badge')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${businessPhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span>{businessPhone}</span>
            </a>
            <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>
            <Link
              to="/admin/login"
              className="flex items-center gap-1 hover:text-amber-400 transition"
              title="Authorized Store Administration"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('nav.adminLogin')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Business Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="block font-display font-bold text-lg leading-tight text-slate-900 group-hover:text-amber-600 transition">
                Rahul Auto Electricals
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Batteries & Electricals
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-md text-sm font-medium transition ${
                  isActive(link.to)
                    ? 'text-amber-600 bg-amber-50 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions: Language Switcher, CTA, Mobile Toggle */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              to="/request-battery"
              className="hidden lg:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-md text-xs font-medium shadow-sm transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.requestBattery')}</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                isActive(link.to)
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 py-1"
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>{t('nav.adminLogin')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

