import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { ProductPublic, WebsiteSettings } from '../types';

interface ProductCardProps {
  product: ProductPublic;
  settings?: WebsiteSettings | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, settings }) => {
  const { t } = useTranslation();

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(product.price));

  const primaryImage = product.images?.find((img) => img.is_primary)?.image_url 
    || product.images?.[0]?.image_url 
    || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80';

  const rawNumber = settings?.whatsapp_number || '+919876543210';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const brandName = product.brand?.name || 'PowerZone';
  const encodedText = encodeURIComponent(
    `Hello Rahul Auto Electricals, I am interested in ${brandName} Battery Model ${product.model} (${product.name}). Please share availability and best price.`
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  // Badge styling depending on stock status
  const getBadgeStyle = () => {
    if (!product.is_in_stock) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (product.stock_status_text.toLowerCase().includes('low')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="group bg-white rounded-lg border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Product Image Box */}
      <div className="relative aspect-[4/3] bg-slate-50 flex items-center justify-center p-4 overflow-hidden border-b border-slate-100">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
        />

        {/* Battery Type Pill */}
        <span className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
          {product.battery_type}
        </span>

        {/* Stock Badge */}
        <span
          className={`absolute top-2.5 right-2.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${getBadgeStyle()}`}
        >
          {product.stock_status_text}
        </span>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Model */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-amber-600 uppercase tracking-wide">
              {brandName}
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              {product.model}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/batteries/${product.slug}`}
            className="block font-semibold text-slate-900 text-sm leading-snug group-hover:text-amber-600 transition mb-2"
          >
            {product.name}
          </Link>

          {/* Key Specs Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
            {product.voltage && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                {product.voltage}
              </span>
            )}
            {product.ah_capacity && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                {product.ah_capacity}
              </span>
            )}
            {product.warranty_duration && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[130px]">{product.warranty_duration}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 mt-auto">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider">M.R.P.</span>
              <span className="text-lg font-bold text-slate-900 tracking-tight font-display">
                {formattedPrice}
              </span>
            </div>
            {product.display_quantity !== null && product.display_quantity !== undefined && (
              <span className="text-xs text-slate-500 font-medium">
                Qty: {product.display_quantity}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/batteries/${product.slug}`}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              <span>{t('catalog.viewDetails')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-md bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
              <span>{t('catalog.enquireWhatsApp')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

