import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, MapPin, Phone, Clock, ShieldCheck, Mail } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface FooterProps {
  settings?: WebsiteSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const { t } = useTranslation();

  const businessAddress = settings?.business_address || 'Shop No. 4, Main Road, Auto Market, Near City Circle';
  const businessPhone = settings?.business_phone || '+91 98765 43210';
  const openingHours = settings?.opening_hours || 'Mon - Sat: 9:00 AM - 8:30 PM, Sun: 10:00 AM - 2:00 PM';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-slate-800 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">100% Genuine Batteries</p>
              <p className="text-xs text-slate-400">Authorized PowerZone and OEM warranty</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Free Battery Health Check</p>
              <p className="text-xs text-slate-400">Professional alternator & cranking test</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Instant Replacement & Fitment</p>
              <p className="text-xs text-slate-400">Fast on-spot installation and disposal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: About */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/logo-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-base text-white">
              Rahul Auto Electricals
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            {t('footer.tagline')}
          </p>
          <div className="inline-block px-3 py-1 bg-slate-800 rounded border border-slate-700 text-xs text-amber-400 font-medium">
            Featured Partner: PowerZone Batteries
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
            {t('footer.quickLinks')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/" className="hover:text-white transition">
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link to="/batteries" className="hover:text-white transition">
                {t('nav.batteries')}
              </Link>
            </li>
            <li>
              <Link to="/request-battery" className="hover:text-white transition">
                {t('nav.requestBattery')}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition">
                {t('nav.contact')}
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="hover:text-amber-400 transition">
                {t('nav.adminLogin')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Categories */}
        <div>
          <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
            {t('footer.categories')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/batteries?type=Car" className="hover:text-white transition">
                {t('catalog.car')}
              </Link>
            </li>
            <li>
              <Link to="/batteries?type=Bike" className="hover:text-white transition">
                {t('catalog.bike')}
              </Link>
            </li>
            <li>
              <Link to="/batteries?type=Truck" className="hover:text-white transition">
                {t('catalog.truck')}
              </Link>
            </li>
            <li>
              <Link to="/batteries?type=Inverter" className="hover:text-white transition">
                {t('catalog.inverter')}
              </Link>
            </li>
            <li>
              <Link to="/batteries?type=Commercial" className="hover:text-white transition">
                {t('catalog.commercial')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Business Details */}
        <div className="space-y-3 text-xs">
          <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
            {t('footer.contactInfo')}
          </h4>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{businessAddress}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <a href={`tel:${businessPhone.replace(/\s+/g, '')}`} className="hover:text-white">
              {businessPhone}
            </a>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{openingHours}</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-slate-800 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <p>© {currentYear} {t('footer.copyright')}</p>
          <p className="text-slate-500 text-[11px]">
            Engineered for high performance automobile electricals & battery distribution.
          </p>
        </div>
      </div>
    </footer>
  );
};

