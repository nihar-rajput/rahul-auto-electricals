import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Plus,
  Minus,
  RefreshCw,
  Search,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ScanBarcode,
} from 'lucide-react';
import {
  fetchInventorySummary,
  fetchInventoryMovements,
  fetchAdminProducts,
  adjustStock,
} from '../../services/api';
import { ProductAdmin, InventoryMovement } from '../../types';

export const AdminInventoryPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<ProductAdmin | null>(null);

  // Form
  const [movementType, setMovementType] = useState<'RESTOCK' | 'MANUAL_REMOVAL' | 'CORRECTION'>('RESTOCK');
  const [quantityChange, setQuantityChange] = useState<number | string>(1);
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const { data: summary } = useQuery({
    queryKey: ['admin-inventory-summary'],
    queryFn: fetchInventorySummary,
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-selector'],
    queryFn: () => fetchAdminProducts({ size: 100 }),
  });

  const { data: movementsData, isLoading: loadingMovements } = useQuery({
    queryKey: ['admin-inventory-movements', { page, selectedProductId }],
    queryFn: () =>
      fetchInventoryMovements({
        product_id: selectedProductId || undefined,
        page,
        size: 20,
      }),
  });

  // Mutation
  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustStock({
        product_id: targetProduct!.id,
        movement_type: movementType,
        quantity_change: Number(quantityChange) || 0,
        reason: reason.trim(),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });

      setAdjustModalOpen(false);
      setReason('');
      setQuantityChange(1);
      setFeedback({
        type: 'success',
        text: `Stock adjusted successfully. New quantity: ${res.new_quantity} units.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Stock adjustment failed.',
      });
    },
  });

  const openAdjustModal = (prod: ProductAdmin, type: 'RESTOCK' | 'MANUAL_REMOVAL' | 'CORRECTION' = 'RESTOCK') => {
    setTargetProduct(prod);
    setMovementType(type);
    setQuantityChange(type === 'CORRECTION' ? prod.quantity : 1);
    setReason(
      type === 'RESTOCK'
        ? 'Distributor inventory arrival'
        : type === 'MANUAL_REMOVAL'
        ? 'Damaged battery removal / warranty return'
        : 'Physical stock audit reconciliation'
    );
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct || !reason.trim()) {
      alert('Please provide a reason for the stock adjustment.');
      return;
    }
    adjustMutation.mutate();
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Stock & Inventory Auditing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time warehouse levels, log restocks and removals, and view immutable movement logs.
          </p>
        </div>

        <button
          onClick={() => {
            if (productsData?.items?.[0]) {
              openAdjustModal(productsData.items[0], 'RESTOCK');
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Adjust Product Stock</span>
        </button>
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

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Stock In Store
          </span>
          <p className="text-3xl font-bold font-display text-slate-900">
            {summary?.total_stock_units || 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Physical battery units</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Healthy Stock Models
          </span>
          <p className="text-3xl font-bold font-display text-emerald-600">
            {summary?.in_stock_count || 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Above low stock threshold</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Low Stock Alerts
          </span>
          <p className="text-3xl font-bold font-display text-amber-600">
            {summary?.low_stock_count || 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Requires re-ordering</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Out of Stock
          </span>
          <p className="text-3xl font-bold font-display text-red-600">
            {summary?.out_of_stock_count || 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Zero inventory available</span>
        </div>
      </div>

      {/* Current Inventory Quick Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-600" />
            <span>Current Stock Quantities</span>
          </h2>
          <span className="text-xs text-slate-400">
            Direct restock or correct physical count
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3">Available Units</th>
                <th className="py-2.5 px-3 text-right">Quick Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsData?.items.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{prod.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                        Model: {prod.model}
                      </span>
                      {prod.part_number && (
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <ScanBarcode className="w-2.5 h-2.5 text-amber-600" />
                          Part #{prod.part_number}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-amber-600 font-medium">{prod.brand?.name}</td>
                  <td className="py-3 px-3 text-slate-600">{prod.battery_type}</td>
                  <td className="py-3 px-3 text-slate-500">{prod.low_stock_threshold} units</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs ${
                        prod.quantity <= 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : prod.quantity <= prod.low_stock_threshold
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {prod.quantity} units
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => openAdjustModal(prod, 'RESTOCK')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold transition"
                    >
                      + Restock
                    </button>
                    <button
                      onClick={() => openAdjustModal(prod, 'MANUAL_REMOVAL')}
                      className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[11px] font-semibold transition"
                    >
                      - Remove
                    </button>
                    <button
                      onClick={() => openAdjustModal(prod, 'CORRECTION')}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-semibold transition"
                    >
                      Correct Count
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Inventory Movements Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>Immutable Inventory Movements History</span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail of every stock modification, sales deduction, and correction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md outline-none"
            >
              <option value="">All Products</option>
              {productsData?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Change</th>
                <th className="py-2.5 px-3">Previous → New</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingMovements ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500" />
                  </td>
                </tr>
              ) : movementsData?.items && movementsData.items.length > 0 ? (
                movementsData.items.map((mov) => {
                  const isPositive = mov.quantity_change > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(mov.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {mov.product_name}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            mov.movement_type === 'RESTOCK'
                              ? 'bg-emerald-50 text-emerald-700'
                              : mov.movement_type === 'SALE'
                              ? 'bg-blue-50 text-blue-700'
                              : mov.movement_type === 'SALE_CANCELLATION'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                          {isPositive ? `+${mov.quantity_change}` : mov.quantity_change}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {mov.previous_quantity} → <strong className="text-slate-900">{mov.new_quantity}</strong>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {mov.reason}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {mov.admin_name || 'System'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No movement records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {movementsData && movementsData.pages > 1 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {movementsData.pages} ({movementsData.total} total logs)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(movementsData.pages, p + 1))}
                disabled={page >= movementsData.pages}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalOpen && targetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Stock Adjustment
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{targetProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs flex justify-between items-center">
              <span className="text-slate-500 font-medium">Current Stock Level:</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                {targetProduct.quantity} units
              </span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="RESTOCK">RESTOCK (+ Add stock)</option>
                  <option value="MANUAL_REMOVAL">MANUAL_REMOVAL (- Remove stock)</option>
                  <option value="CORRECTION">CORRECTION (Reconcile to actual count)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {movementType === 'CORRECTION' ? 'New Reconciled Total Count' : 'Quantity to Add / Remove'}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantityChange ?? ''}
                  onChange={(e) => setQuantityChange(e.target.value === '' ? '' : e.target.value)}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Reason *</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Shipment arrival from PowerZone distributor, invoice #1234"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  {adjustMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Stock Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

