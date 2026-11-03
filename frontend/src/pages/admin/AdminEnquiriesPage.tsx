import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Search,
  MessageCircle,
  Phone,
  CheckCircle,
  Clock,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import {
  fetchAdminEnquiries,
  fetchEnquiryStats,
  updateEnquiry,
  deleteEnquiry,
  fetchPublicSettings,
} from '../../services/api';
import { CustomerEnquiry } from '../../types';

export const AdminEnquiriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Selected enquiry for detail & notes update
  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(null);
  const [newStatus, setNewStatus] = useState<string>('NEW');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['admin-enquiry-stats'],
    queryFn: fetchEnquiryStats,
  });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings-enquiries'],
    queryFn: fetchPublicSettings,
  });

  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['admin-enquiries', { search, statusFilter, page }],
    queryFn: () =>
      fetchAdminEnquiries({
        search: search || undefined,
        status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        size: 15,
      }),
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      updateEnquiry(selectedEnquiry!.id, {
        status: newStatus,
        admin_notes: adminNotes,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-enquiry-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setSelectedEnquiry(null);
      setFeedback({ type: 'success', text: 'Enquiry updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-enquiry-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setFeedback({ type: 'success', text: 'Enquiry deleted.' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const openDetailModal = (enq: CustomerEnquiry) => {
    setSelectedEnquiry(enq);
    setNewStatus(enq.status);
    setAdminNotes(enq.admin_notes || '');
  };

  const getWhatsAppUrl = (enq: CustomerEnquiry) => {
    const cleanCustomerPhone = enq.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${enq.customer_name}, this is Rahul Auto Electricals regarding your battery enquiry for ${enq.vehicle_brand || ''} ${enq.vehicle_model || ''}. How can we assist you today?`
    );
    return `https://wa.me/${cleanCustomerPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">
          Customer Enquiries & Battery Requests
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review customer inquiries submitted online, track resolution status, and contact leads directly via WhatsApp or Phone.
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

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <span className="text-xs uppercase tracking-wider block font-semibold">Total Leads</span>
          <span className="text-2xl font-bold font-display">{stats?.total || 0}</span>
        </button>

        <button
          onClick={() => setStatusFilter('NEW')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'NEW' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <span className="text-xs uppercase tracking-wider block font-semibold">New Enquiries</span>
          <span className="text-2xl font-bold font-display">{stats?.new || 0}</span>
        </button>

        <button
          onClick={() => setStatusFilter('CONTACTED')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'CONTACTED' ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <span className="text-xs uppercase tracking-wider block font-semibold">Contacted</span>
          <span className="text-2xl font-bold font-display">{stats?.contacted || 0}</span>
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <span className="text-xs uppercase tracking-wider block font-semibold">Completed</span>
          <span className="text-2xl font-bold font-display">{stats?.completed || 0}</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, phone number, vehicle..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-3">Vehicle Info</th>
                <th className="py-3 px-3">Battery Request</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Submission Date</th>
                <th className="py-3 px-3">Internal Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500" />
                  </td>
                </tr>
              ) : enquiriesData?.items && enquiriesData.items.length > 0 ? (
                enquiriesData.items.map((enq) => {
                  const cleanPhone = enq.phone.replace(/[^0-9]/g, '');
                  return (
                    <tr key={enq.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{enq.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{enq.phone}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800">
                          {enq.vehicle_brand || 'General'} {enq.vehicle_model || ''}
                        </p>
                        <p className="text-[11px] text-slate-400">{enq.vehicle_year || 'Year not specified'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-amber-600 block">{enq.preferred_brand || 'PowerZone'}</span>
                        <span className="text-[11px] text-slate-500">{enq.battery_type || 'Car'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            enq.status === 'NEW'
                              ? 'bg-indigo-50 text-indigo-700'
                              : enq.status === 'CONTACTED'
                              ? 'bg-amber-50 text-amber-700'
                              : enq.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(enq.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[11px]">
                        {enq.admin_notes || 'No notes added'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <a
                          href={getWhatsAppUrl(enq)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Contact on WhatsApp"
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
                        <button
                          onClick={() => openDetailModal(enq)}
                          className="inline-flex p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded"
                          title="Edit Status / Notes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this enquiry?')) {
                              deleteMutation.mutate(enq.id);
                            }
                          }}
                          className="inline-flex p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No enquiries match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Enquiry Details & Notes
              </h3>
              <button onClick={() => setSelectedEnquiry(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p><strong className="text-slate-900">Customer:</strong> {selectedEnquiry.customer_name} ({selectedEnquiry.phone})</p>
              <p><strong className="text-slate-900">Vehicle:</strong> {selectedEnquiry.vehicle_brand} {selectedEnquiry.vehicle_model} {selectedEnquiry.vehicle_year || ''}</p>
              <p><strong className="text-slate-900">Required Battery:</strong> {selectedEnquiry.battery_type} — Preferred: {selectedEnquiry.preferred_brand || 'Any'}</p>
              {selectedEnquiry.message && (
                <p className="pt-1 text-slate-600 border-t border-slate-200 mt-2">
                  <strong>Customer Message:</strong> "{selectedEnquiry.message}"
                </p>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="NEW">NEW (Unprocessed)</option>
                  <option value="CONTACTED">CONTACTED (Followed up via call/WhatsApp)</option>
                  <option value="COMPLETED">COMPLETED (Sale fulfilled or closed)</option>
                  <option value="CANCELLED">CANCELLED (Not interested)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record customer discussion, quoted battery model, or callback time..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <a
                href={getWhatsAppUrl(selectedEnquiry)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 stroke-none" />
                <span>Open WhatsApp Chat</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Update Enquiry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

