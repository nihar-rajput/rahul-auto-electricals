import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Eye,
  Sliders,
} from 'lucide-react';
import { fetchAdminSettings, updateAdminSettings } from '../../services/api';
import { WebsiteSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<WebsiteSettings>>({
    business_name: '',
    business_phone: '',
    whatsapp_number: '',
    business_address: '',
    opening_hours: '',
    maps_url: '',
    default_stock_visibility_mode: 'SIMPLE_STATUS',
    default_low_stock_threshold: 5,
    default_language: 'en',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings-full'],
    queryFn: fetchAdminSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name,
        business_phone: settings.business_phone,
        whatsapp_number: settings.whatsapp_number,
        business_address: settings.business_address,
        opening_hours: settings.opening_hours,
        maps_url: settings.maps_url,
        default_stock_visibility_mode: settings.default_stock_visibility_mode,
        default_low_stock_threshold: settings.default_low_stock_threshold,
        default_language: settings.default_language,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminSettings({
        ...formData,
        default_low_stock_threshold: Number(formData.default_low_stock_threshold) || 5,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings-full'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      setFeedback({ type: 'success', text: 'Business settings updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to update settings.' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">
          Store Configuration & Business Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure storefront contact details, customer WhatsApp integration, and global stock visibility rules.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg flex items-center gap-2 text-xs font-medium ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <h2 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-amber-600" />
              <span>Business Profile</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.business_name || ''}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Public Phone Number</span>
                </label>
                <input
                  type="text"
                  value={formData.business_phone || ''}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Business WhatsApp Number</span>
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_number || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  required
                  placeholder="+919876543210"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Address</span>
              </label>
              <textarea
                rows={2}
                value={formData.business_address || ''}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Operating Hours</span>
                </label>
                <input
                  type="text"
                  value={formData.opening_hours || ''}
                  onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Google Maps Link</label>
                <input
                  type="url"
                  value={formData.maps_url || ''}
                  onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Stock Visibility Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <h2 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2 pb-2 border-b border-slate-100">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Stock Visibility & Threshold Defaults</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Customer Stock Visibility Mode
                </label>
                <select
                  value={formData.default_stock_visibility_mode || 'SIMPLE_STATUS'}
                  onChange={(e) =>
                    setFormData({ ...formData, default_stock_visibility_mode: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="SIMPLE_STATUS">SIMPLE_STATUS ("In Stock" / "Out of Stock")</option>
                  <option value="EXACT_QUANTITY">EXACT_QUANTITY ("12 units available")</option>
                  <option value="STOCK_LEVEL">STOCK_LEVEL ("Low Stock" / "In Stock" / "Out of Stock")</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Can also be overridden individually per product in product editor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default Low Stock Threshold</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={formData.default_low_stock_threshold ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      default_low_stock_threshold: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10),
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  When inventory falls to or below this count, it triggers low stock warnings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-8 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-400" />}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

