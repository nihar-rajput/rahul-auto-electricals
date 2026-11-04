import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Zap,
  Car,
  MessageCircle,
  Phone,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { fetchProductBySlug } from '../services/api';
import { WebsiteSettings } from '../types';

interface ProductDetailPageProps {
  settings?: WebsiteSettings | null;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ settings }) => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="h-96 bg-slate-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="h-6 bg-slate-100 rounded w-1/4" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <BadgeAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested battery model may have been unpublished or removed.
        </p>
        <Link
          to="/batteries"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Battery Catalog</span>
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(product.price));

  const images = product.images?.length > 0
    ? product.images.map((i) => i.image_url)
    : ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'];

  const rawNumber = settings?.whatsapp_number || '+919876543210';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const brandName = product.brand?.name || 'PowerZone';
  const encodedText = encodeURIComponent(
    `Hello Rahul Auto Electricals, I am interested in ${brandName} Battery Model ${product.model} (${product.name}). Please share availability and best price.`
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  const businessPhone = settings?.business_phone || '+91 98765 43210';
  const cleanPhone = businessPhone.replace(/[^0-9+]/g, '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span>/</span>
        <Link to="/batteries" className="hover:text-slate-900">
          Batteries
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Images */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/3] bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-center overflow-hidden">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg border p-1 bg-white shrink-0 overflow-hidden transition ${
                    selectedImageIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Technical Specs & Purchasing Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                {brandName}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                {product.battery_type} Battery
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                  product.is_in_stock
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {product.stock_status_text}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {product.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Model: {product.model} {product.part_number ? `| Part #: ${product.part_number}` : ''}
            </p>
          </div>

          {/* Price & Stock Display */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
                Retail Selling Price (M.R.P.)
              </span>
              <span className="text-3xl font-bold font-display text-slate-900">
                {formattedPrice}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Includes GST & standard dealer warranty. Old battery scrap discount applicable.
              </span>
            </div>

            {product.display_quantity !== null && product.display_quantity !== undefined && (
              <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-md border border-slate-200">
                {product.display_quantity} Available
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-sm transition"
            >
              <MessageCircle className="w-5 h-5 fill-white stroke-none" />
              <span>{t('product.enquireNow')}</span>
            </a>

            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call Store: {businessPhone}</span>
            </a>
          </div>

          {/* Key Technical Specifications Table */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {t('product.specs')}
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <dt className="text-slate-400 font-medium">Model</dt>
                <dd className="font-bold text-slate-900 font-mono mt-0.5">
                  {product.model}
                </dd>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <dt className="text-slate-400 font-medium">Battery Type</dt>
                <dd className="font-bold text-slate-900 mt-0.5">
                  {product.battery_type}
                </dd>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <dt className="text-slate-400 font-medium">{t('product.warranty')}</dt>
                <dd className="font-bold text-slate-900 mt-0.5">
                  {product.warranty_duration || 'Standard OEM'}
                </dd>
              </div>

              {product.part_number && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <dt className="text-slate-400 font-medium">Part / Serial</dt>
                  <dd className="font-bold text-slate-900 font-mono mt-0.5">
                    {product.part_number}
                  </dd>
                </div>
              )}

              {product.guarantee_details && (
                <div className="col-span-2 sm:col-span-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <dt className="text-slate-400 font-medium">{t('product.guarantee')}</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {product.guarantee_details}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Product Description */}
      {product.description && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-3">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>{t('product.description')}</span>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </section>
      )}

      {/* Vehicle Compatibility Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
          <Car className="w-5 h-5 text-amber-600" />
          <span>{t('product.compatibleVehicles')}</span>
        </h2>
        <p className="text-xs text-slate-500">
          This battery is engineered and verified for direct OEM fitment on the following vehicle models:
        </p>

        {product.compatibilities && product.compatibilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {product.compatibilities.map((comp) => {
              const veh = comp.vehicle;
              if (!veh) return null;
              const yearRange = comp.compatible_from_year
                ? `${comp.compatible_from_year} - ${comp.compatible_to_year || 'Present'}`
                : 'All Model Years';

              return (
                <div
                  key={comp.id}
                  className="p-3 bg-slate-50 border border-slate-200/90 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-900 text-xs block">
                      {veh.manufacturer} {veh.model}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {yearRange} {veh.fuel_type ? `• ${veh.fuel_type}` : ''}
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500">
            Universal standard terminal fitment. Contact our technicians to verify your vehicle suitability.
          </div>
        )}
      </section>
    </div>
  );
};

