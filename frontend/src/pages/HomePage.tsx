import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  Search,
  ShieldCheck,
  Truck,
  Car,
  Bike,
  Cpu,
  ArrowRight,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { fetchPublicProducts, fetchBrands } from '../services/api';
import { VehicleFinder } from '../components/VehicleFinder';
import { ProductCard } from '../components/ProductCard';
import { WebsiteSettings } from '../types';

interface HomePageProps {
  settings?: WebsiteSettings | null;
}

export const HomePage: React.FC<HomePageProps> = ({ settings }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch featured products
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetchPublicProducts({ size: 8, sort_by: 'newest' }),
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/batteries?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/batteries');
    }
  };

  const categories = [
    { type: 'Car', label: t('catalog.car'), icon: Car, count: '35Ah - 100Ah' },
    { type: 'Bike', label: t('catalog.bike'), icon: Bike, count: '2.5Ah - 14Ah' },
    { type: 'Truck', label: t('catalog.truck'), icon: Truck, count: '100Ah - 200Ah' },
    { type: 'Inverter', label: t('catalog.inverter'), icon: Cpu, count: '100Ah - 250Ah' },
    { type: 'Commercial', label: t('catalog.commercial'), icon: Zap, count: 'Heavy Duty' },
  ];

  const businessPhone = settings?.business_phone || '+91 98765 43210';
  const cleanPhone = businessPhone.replace(/[^0-9+]/g, '');
  const rawWhatsApp = settings?.whatsapp_number || '+919876543210';
  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 lg:py-24 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display leading-[1.15]">
                {t('hero.title')}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Instant Search Bar */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl flex items-center bg-white rounded-lg p-1.5 shadow-lg">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('catalog.searchPlaceholder')}
                    className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-md text-sm transition shadow-sm"
                >
                  {t('finder.searchButton')}
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/batteries"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-md text-sm shadow-sm transition"
                >
                  <span>{t('hero.exploreCatalog')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-md text-sm border border-slate-700 transition"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>{t('hero.callNow')}</span>
                </a>

                <a
                  href={`https://wa.me/${cleanWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium px-4 py-2.5 rounded-md text-sm transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                  <span>{t('hero.whatsappUs')}</span>
                </a>
              </div>
            </div>

            {/* Right Card / Brand Feature */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-6 sm:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Featured Brand
                    </span>
                    <h2 className="text-2xl font-bold font-display text-white">PowerZone Batteries</h2>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    PZ
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Patented silver alloy technology for Indian extreme temperatures</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Zero maintenance with high cranking amps for instant start</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Manufacturer warranty with quick hassle-free replacement</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Free in-shop testing and charging diagnostics</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/batteries?brand=powerzone"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <span>View All PowerZone Batteries</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Compatibility Finder Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <VehicleFinder settings={settings} />
      </section>

      {/* Battery Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              {t('catalog.filterByType')}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explore specialized battery lines designed for every vehicle and application.
            </p>
          </div>
          <Link
            to="/batteries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <span>{t('catalog.allTypes')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.type}
                to={`/batteries?type=${cat.type}`}
                className="group p-5 bg-white rounded-xl border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-amber-400 transition-all text-center flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-amber-50 text-slate-700 group-hover:text-amber-600 flex items-center justify-center mb-3 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition">
                  {cat.label}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1">
                  {cat.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Batteries Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
              Popular Selections
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Featured Automobile Batteries
            </h2>
          </div>
          <Link
            to="/batteries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>View Complete Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredData?.items.map((prod) => (
              <ProductCard key={prod.id} product={prod} settings={settings} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Battery Brands */}
      {brands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-8 text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
              Authorized Distribution & Sales Partners
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/batteries?brand=${b.slug}`}
                  className="px-6 py-3 bg-white rounded-lg border border-slate-200 hover:border-amber-400 hover:shadow-subtle transition font-display font-bold text-slate-800 text-base"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Request Specific Battery Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Can't Find Your Battery?
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-display">
              {t('request.title')}
            </h3>
            <p className="text-sm text-slate-300">
              {t('request.subtitle')}
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to="/request-battery"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-md text-sm shadow-md transition"
            >
              <span>{t('nav.requestBattery')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact & Workshop Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{t('contact.addressTitle')}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings?.business_address || 'Shop No. 4, Main Road, Auto Market, Near City Circle'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{t('contact.phoneTitle')}</h4>
              <p className="text-xs text-slate-600 mb-1">{businessPhone}</p>
              <a
                href={`tel:${cleanPhone}`}
                className="text-xs font-semibold text-amber-600 hover:underline inline-block"
              >
                Call Support Now
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{t('contact.hoursTitle')}</h4>
              <p className="text-xs text-slate-600">
                {settings?.opening_hours || 'Mon - Sat: 9:00 AM - 8:30 PM, Sun: 10:00 AM - 2:00 PM'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

