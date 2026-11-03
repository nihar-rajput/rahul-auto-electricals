import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { submitContactMessage } from '../services/api';
import { WebsiteSettings } from '../types';

const contactSchema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactPageProps {
  settings?: WebsiteSettings | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const { t } = useTranslation();
  const [successMsg, setSuccessMsg] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setServerError(null);
    try {
      await submitContactMessage({
        customer_name: data.customer_name,
        phone: data.phone,
        message: data.message,
      });
      setSuccessMsg(true);
      reset();
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to send message.');
    }
  };

  const businessAddress = settings?.business_address || 'Shop No. 4, Main Road, Auto Market, Near City Circle';
  const businessPhone = settings?.business_phone || '+91 98765 43210';
  const rawWhatsApp = settings?.whatsapp_number || '+919876543210';
  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, '');
  const openingHours = settings?.opening_hours || 'Mon - Sat: 9:00 AM - 8:30 PM, Sun: 10:00 AM - 2:00 PM';
  const mapsUrl = settings?.maps_url || 'https://maps.google.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Page Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">
          {t('contact.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Business Contacts & Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-card">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('contact.addressTitle')}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {businessAddress}
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 mt-2"
                >
                  <span>{t('contact.openGoogleMaps')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('contact.phoneTitle')}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Call: <strong className="text-slate-800">{businessPhone}</strong>
                </p>
                <div className="mt-3">
                  <a
                    href={`https://wa.me/${cleanWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md text-xs font-semibold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                    <span>WhatsApp: {rawWhatsApp}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('contact.hoursTitle')}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {openingHours}
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Google Maps Placeholder or Link Box */}
          <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden aspect-video flex flex-col items-center justify-center p-6 text-center shadow-subtle">
            <MapPin className="w-8 h-8 text-amber-600 mb-2" />
            <h4 className="font-semibold text-slate-900 text-sm">Interactive Store Directions</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
              View Rahul Auto Electricals location, customer parking, and navigate directly.
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
            >
              <span>{t('contact.openGoogleMaps')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-card">
            <h3 className="text-lg font-bold text-slate-900 font-display mb-1">
              {t('contact.sendUsMessage')}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Have questions regarding automobile battery capacity, testing, or wholesale pricing? Leave a message.
            </p>

            {successMsg ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">
                  {t('contact.messageSent')}
                </h4>
                <p className="text-xs text-emerald-700">
                  We have received your enquiry and our service team will contact you back shortly.
                </p>
                <button
                  onClick={() => setSuccessMsg(false)}
                  className="px-4 py-1.5 bg-white border border-emerald-300 rounded text-xs font-semibold text-emerald-800"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('contact.yourName')} *
                  </label>
                  <input
                    type="text"
                    {...register('customer_name')}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                  {errors.customer_name && (
                    <p className="text-red-500 text-[11px] mt-1">{errors.customer_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('contact.yourPhone')} *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-[11px] mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('contact.yourMessage')} *
                  </label>
                  <textarea
                    {...register('message')}
                    rows={4}
                    placeholder="How can Rahul Auto Electricals help you?"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                  {errors.message && (
                    <p className="text-red-500 text-[11px] mt-1">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-lg text-xs shadow-sm transition"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('contact.sendMessage')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

