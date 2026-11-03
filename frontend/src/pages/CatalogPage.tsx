import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BatteryCharging,
  ScanBarcode,
} from 'lucide-react';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { fetchPublicProducts, fetchBrands } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { WebsiteSettings } from '../types';

interface CatalogPageProps {
  settings?: WebsiteSettings | null;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ settings }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter state initialized from URL query parameters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [batteryType, setBatteryType] = useState(searchParams.get('type') || 'all');
  const [brand, setBrand] = useState(searchParams.get('brand') || 'all');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('in_stock') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'newest');
  const [priceMax, setPriceMax] = useState<number | undefined>(
    searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchInput) params.search = searchInput;
    if (batteryType && batteryType !== 'all') params.type = batteryType;
    if (brand && brand !== 'all') params.brand = brand;
    if (inStockOnly) params.in_stock = 'true';
    if (sortBy && sortBy !== 'newest') params.sort_by = sortBy;
    if (priceMax) params.price_max = priceMax.toString();
    if (page > 1) params.page = page.toString();

    setSearchParams(params, { replace: true });
  }, [searchInput, batteryType, brand, inStockOnly, sortBy, priceMax, page, setSearchParams]);

  // Fetch Brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  // Fetch Products query
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['catalog-products', { searchInput, batteryType, brand, inStockOnly, sortBy, priceMax, page }],
    queryFn: () =>
      fetchPublicProducts({
        search: searchInput || undefined,
        battery_type: batteryType !== 'all' ? batteryType : undefined,
        brand: brand !== 'all' ? brand : undefined,
        in_stock: inStockOnly ? true : undefined,
        price_max: priceMax,
        sort_by: sortBy,
        page,
        size: 12,
      }),
  });

  const handleResetFilters = () => {
    setSearchInput('');
    setBatteryType('all');
    setBrand('all');
    setInStockOnly(false);
    setPriceMax(undefined);
    setSortBy('newest');
    setPage(1);
  };

  const batteryTypes = [
    { value: 'all', label: t('catalog.allTypes') },
    { value: 'Car', label: t('catalog.car') },
    { value: 'Bike', label: t('catalog.bike') },
    { value: 'Truck', label: t('catalog.truck') },
    { value: 'Inverter', label: t('catalog.inverter') },
    { value: 'Commercial', label: t('catalog.commercial') },
    { value: 'Other', label: t('catalog.other') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title & Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">
          {t('catalog.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('catalog.subtitle')}
        </p>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filter (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>Filters</span>
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('catalog.resetFilters')}</span>
              </button>
            </div>

            {/* Battery Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                {t('catalog.filterByType')}
              </label>
              <div className="space-y-1.5">
                {batteryTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setBatteryType(type.value);
                      setPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                      batteryType === type.value
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                {t('catalog.filterByBrand')}
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setBrand('all');
                    setPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                    brand === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('catalog.allBrands')}
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBrand(b.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                      brand === b.slug
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Only Checkbox */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  {t('catalog.inStockOnly')}
                </span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Bar: Search Input, Sorting, Mobile Filter Trigger */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder={t('catalog.searchPlaceholder')}
                className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setBarcodeModalOpen(true)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                title="Scan Battery Barcode / QR to Find"
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden px-3 py-2 text-xs border border-slate-300 rounded-md flex items-center gap-1.5 text-slate-700 hover:bg-slate-50"
              >
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>Filters</span>
              </button>

              {/* Sorting Selector */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="newest">{t('catalog.sortNewest')}</option>
                <option value="price_asc">{t('catalog.sortPriceLow')}</option>
                <option value="price_desc">{t('catalog.sortPriceHigh')}</option>
                <option value="name_asc">{t('catalog.sortNameAsc')}</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter Drawer */}
          {mobileFilterOpen && (
            <div className="lg:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-4 animate-in slide-in-from-top duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs text-slate-900">Filter By Type</span>
                <button onClick={handleResetFilters} className="text-xs text-amber-600">
                  {t('catalog.resetFilters')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {batteryTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setBatteryType(type.value);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded text-xs ${
                      batteryType === type.value
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span className="text-xs text-slate-700">{t('catalog.inStockOnly')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing {data?.items.length || 0} of {data?.total || 0} batteries
            </span>
            {(searchInput || batteryType !== 'all' || brand !== 'all' || inStockOnly) && (
              <button
                onClick={handleResetFilters}
                className="text-amber-600 hover:underline font-medium"
              >
                {t('catalog.clearSearch')}
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.items && data.items.length > 0 ? (
            /* Product Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((prod) => (
                <ProductCard key={prod.id} product={prod} settings={settings} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <BatteryCharging className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {t('catalog.noProductsFound')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different battery model, vehicle name, or reset the filters to see all available stock.
              </p>
              <div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition"
                >
                  {t('catalog.resetFilters')}
                </button>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.pages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isPlaceholderData}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('catalog.prev')}</span>
              </button>

              <span className="text-xs text-slate-600 font-medium">
                {t('catalog.page')} {page} {t('catalog.of')} {data.pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages || isPlaceholderData}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <span>{t('catalog.next')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        onScan={(scannedCode) => {
          setSearchInput(scannedCode);
          setPage(1);
        }}
        title="Scan Battery Barcode / QR Code"
        subtitle="Point camera at any battery barcode to instantly lookup specifications"
      />
    </div>
  );
};

