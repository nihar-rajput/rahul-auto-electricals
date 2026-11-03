import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  AlertTriangle,
  BatteryCharging,
  TrendingUp,
  Inbox,
  ArrowRight,
  Plus,
  Receipt,
  MessageCircle,
  Phone,
  Clock,
} from 'lucide-react';
import { fetchDashboardStats, fetchPublicSettings } from '../../services/api';

export const AdminOverviewPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings-preview'],
    queryFn: fetchPublicSettings,
  });

  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(stats?.total_sales_revenue || 0));

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Store Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time battery inventory, sales, and customer inquiry metrics for Rahul Auto Electricals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/admin/sales"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Products</span>
            <BatteryCharging className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-900">
            {isLoading ? '...' : stats?.total_products}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Catalog active models</span>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Units</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-display text-slate-900">
            {isLoading ? '...' : stats?.total_stock_units}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Physical units in stock</span>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-display text-amber-600">
            {isLoading ? '...' : stats?.low_stock_count}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Below threshold units</span>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold font-display text-red-600">
            {isLoading ? '...' : stats?.out_of_stock_count}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires re-ordering</span>
        </div>

        {/* Total Sales Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-display text-slate-900 truncate">
            {isLoading ? '...' : formattedRevenue}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.total_sales_count || 0} recorded sales
          </span>
        </div>

        {/* New Customer Enquiries */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Leads</span>
            <Inbox className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-display text-indigo-600">
            {isLoading ? '...' : stats?.new_enquiries_count}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Unprocessed enquiries</span>
        </div>
      </div>

      {/* Recent Enquiries & Quick Support Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Enquiries Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900 font-display">
                Recent Customer Enquiries
              </h2>
              <p className="text-xs text-slate-400">
                Latest customer requirements submitted through website or vehicle finder.
              </p>
            </div>
            <Link
              to="/admin/enquiries"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recent_enquiries && stats.recent_enquiries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent_enquiries.map((enq) => {
                    const cleanPhone = enq.phone.replace(/[^0-9]/g, '');
                    const rawWhatsApp = settings?.whatsapp_number || '+919876543210';
                    const prefilled = encodeURIComponent(
                      `Hello ${enq.customer_name}, thank you for contacting Rahul Auto Electricals regarding a battery for your ${enq.vehicle_brand || ''} ${enq.vehicle_model || ''}. How can we assist you today?`
                    );
                    const waUrl = `https://wa.me/${cleanPhone}?text=${prefilled}`;

                    return (
                      <tr key={enq.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900">{enq.customer_name}</p>
                          <p className="text-[11px] text-slate-400">{enq.phone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700">
                            {enq.vehicle_brand || 'General'} {enq.vehicle_model || ''}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {enq.battery_type || 'Car'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                              enq.status === 'NEW'
                                ? 'bg-indigo-50 text-indigo-700'
                                : enq.status === 'CONTACTED'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400">
                          {new Date(enq.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 fill-emerald-600 stroke-none" />
                          </a>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="inline-flex p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="Call Phone"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No new customer enquiries at the moment.
            </p>
          )}
        </div>

        {/* Quick Inventory Health Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Inventory Health Alert
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-900">Low Stock Batteries</span>
                </div>
                <span className="font-bold text-sm text-amber-800">
                  {stats?.low_stock_count || 0}
                </span>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-900">Out of Stock Models</span>
                </div>
                <span className="font-bold text-sm text-red-800">
                  {stats?.out_of_stock_count || 0}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/admin/inventory"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                <span>Manage Stock & Movements</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

