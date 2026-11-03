import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Search, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchVehicleManufacturers, fetchVehicleModels, fetchCompatibleBatteries } from '../services/api';
import { ProductPublic, WebsiteSettings } from '../types';
import { ProductCard } from './ProductCard';

interface VehicleFinderProps {
  settings?: WebsiteSettings | null;
}

export const VehicleFinder: React.FC<VehicleFinderProps> = ({ settings }) => {
  const { t } = useTranslation();

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [loadingMakes, setLoadingMakes] = useState<boolean>(true);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [results, setResults] = useState<ProductPublic[]>([]);

  // Years list (e.g. 2010 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  // Load makes on mount
  useEffect(() => {
    const loadMakes = async () => {
      try {
        const data = await fetchVehicleManufacturers();
        setManufacturers(data);
      } catch (err) {
        console.error('Failed to load vehicle makes', err);
      } finally {
        setLoadingMakes(false);
      }
    };
    loadMakes();
  }, []);

  // When make changes, load models
  const handleMakeChange = async (make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    setHasSearched(false);
    setResults([]);
    if (!make) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    try {
      const data = await fetchVehicleModels(make);
      setModels(data);
    } catch (err) {
      console.error('Failed to load models', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake || !selectedModel) return;

    setSearching(true);
    try {
      const yr = selectedYear ? parseInt(selectedYear, 10) : undefined;
      const data = await fetchCompatibleBatteries({
        manufacturer: selectedMake,
        model: selectedModel,
        year: yr,
      });
      setResults(data);
      setHasSearched(true);
    } catch (err) {
      console.error('Vehicle search error', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">
            {t('finder.title')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('finder.subtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Make Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {t('finder.selectMake')}
          </label>
          <select
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            disabled={loadingMakes}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-slate-100"
            required
          >
            <option value="">-- {t('finder.selectMake')} --</option>
            {manufacturers.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        {/* Model Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {t('finder.selectModel')}
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedMake || loadingModels}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
            required
          >
            <option value="">
              {loadingModels ? 'Loading models...' : `-- ${t('finder.selectModel')} --`}
            </option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Year Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {t('finder.selectYear')}
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!selectedModel}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">{t('finder.anyYear')}</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Search Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!selectedMake || !selectedModel || searching}
            className="w-full h-[38px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-sm rounded-md shadow-sm transition"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-amber-400" />
                <span>{t('finder.searchButton')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {hasSearched && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-slate-900 text-sm">
                {results.length > 0
                  ? t('finder.resultsFound', { count: results.length })
                  : t('finder.noResults')}
              </h4>
            </div>
            {selectedMake && selectedModel && (
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-medium">
                {selectedMake} {selectedModel} {selectedYear ? `(${selectedYear})` : ''}
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} settings={settings} />
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-sm text-slate-600 mb-3">
                {t('finder.noResults')}
              </p>
              <a
                href="/request-battery"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
              >
                <span>Click here to submit an enquiry for {selectedMake} {selectedModel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

