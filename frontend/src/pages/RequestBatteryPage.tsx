import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Inbox,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Car,
  Phone,
  User,
} from 'lucide-react';
import { submitEnquiry } from '../services/api';
import { WebsiteSettings } from '../types';

const enquirySchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid 10-digit mobile number'),
  vehicle_brand: z.string().min(2, 'Vehicle brand/make is required'),
  vehicle_model: z.string().min(1, 'Vehicle model is required'),
  vehicle_year: z.string().optional(),
  battery_type: z.string().optional(),
  preferred_brand: z.string().optional(),
  message: z.string().optional(),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface RequestBatteryPageProps {
  settings?: WebsiteSettings | null;
}

export const RequestBatteryPage: React.FC<RequestBatteryPageProps> = ({ settings }) => {
  const { t } = useTranslation();
  const [submittedData, setSubmittedData] = useState<EnquiryFormData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      battery_type: 'Car',
      preferred_brand: 'PowerZone',
    },
  });

  const onSubmit = async (data: EnquiryFormData) => {
    setServerError(null);
    try {
      await submitEnquiry(data);
      setSubmittedData(data);
      reset();
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to submit enquiry. Please try again.');
    }
  };

  const rawNumber = settings?.whatsapp_number || '+919876543210';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

  const getWhatsAppFollowupUrl = () => {
    if (!submittedData) return `https://wa.me/${cleanNumber}`;
    const text = encodeURIComponent(
      `Hello Rahul Auto Electricals, I just submitted an enquiry for my ${submittedData.vehicle_brand} ${submittedData.vehicle_model} (${submittedData.customer_name}). Please share suitable battery options.`
    );
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
          <Inbox className="w-3.5 h-3.5" />
          <span>Direct Specialist Assistance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">
          {t('request.title')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('request.subtitle')}
        </p>
      </div>

      {submittedData ? (
        /* Success State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-card">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-display text-slate-900">
              {t('request.successTitle')}
            </h2>
            <p className="text-sm text-slate-600">
              {t('request.successMessage')}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1">
            <p><span className="text-slate-400">Customer:</span> <strong className="text-slate-800">{submittedData.customer_name}</strong></p>
            <p><span className="text-slate-400">Phone:</span> <strong className="text-slate-800">{submittedData.phone}</strong></p>
            <p><span className="text-slate-400">Vehicle:</span> <strong className="text-slate-800">{submittedData.vehicle_brand} {submittedData.vehicle_model} {submittedData.vehicle_year || ''}</strong></p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={getWhatsAppFollowupUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-lg text-sm shadow-sm transition"
            >
              <MessageCircle className="w-5 h-5 fill-white stroke-none" />
              <span>{t('request.sendOnWhatsApp')}</span>
            </a>

            <button
              onClick={() => setSubmittedData(null)}
              className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition"
            >
              {t('request.submitAnother')}
            </button>
          </div>
        </div>
      ) : (
        /* The Enquiry Form */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-card">
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('request.name')} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...register('customer_name')}
                    placeholder={t('request.namePlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                </div>
                {errors.customer_name && (
                  <p className="text-red-500 text-[11px] mt-1">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('request.phone')} *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder={t('request.phonePlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-[11px] mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-500" />
                <span>Vehicle Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('request.vehicleBrand')} *
                  </label>
                  <input
                    type="text"
                    {...register('vehicle_brand')}
                    placeholder={t('request.vehicleBrandPlaceholder')}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                  {errors.vehicle_brand && (
                    <p className="text-red-500 text-[11px] mt-1">{errors.vehicle_brand.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('request.vehicleModel')} *
                  </label>
                  <input
                    type="text"
                    {...register('vehicle_model')}
                    placeholder={t('request.vehicleModelPlaceholder')}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                  {errors.vehicle_model && (
                    <p className="text-red-500 text-[11px] mt-1">{errors.vehicle_model.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('request.vehicleYear')}
                  </label>
                  <input
                    type="text"
                    {...register('vehicle_year')}
                    placeholder={t('request.vehicleYearPlaceholder')}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Battery Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('request.batteryType')}
                </label>
                <select
                  {...register('battery_type')}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                >
                  <option value="Car">{t('catalog.car')}</option>
                  <option value="Bike">{t('catalog.bike')}</option>
                  <option value="Truck">{t('catalog.truck')}</option>
                  <option value="Inverter">{t('catalog.inverter')}</option>
                  <option value="Commercial">{t('catalog.commercial')}</option>
                  <option value="Other">{t('catalog.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('request.preferredBrand')}
                </label>
                <select
                  {...register('preferred_brand')}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                >
                  <option value="PowerZone">PowerZone (Recommended)</option>
                  <option value="Exide">Exide</option>
                  <option value="Amaron">Amaron</option>
                  <option value="Any">Any Trusted Brand</option>
                </select>
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('request.message')}
              </label>
              <textarea
                {...register('message')}
                rows={3}
                placeholder={t('request.messagePlaceholder')}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-lg text-sm shadow-sm transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('request.submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('request.submit')}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

