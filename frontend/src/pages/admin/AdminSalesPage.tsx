import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  X,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  User,
  Phone,
  FileText,
  ScanBarcode,
} from 'lucide-react';
import { BarcodeScannerModal } from '../../components/BarcodeScannerModal';
import {
  fetchAdminSales,
  recordSale,
  cancelSale,
  fetchAdminProducts,
} from '../../services/api';
import { Sale, ProductAdmin } from '../../types';

export const AdminSalesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // New Sale Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Sale items list for the new sale
  const [saleItems, setSaleItems] = useState<
    { product_id: string; product_name: string; quantity: number; unit_price: number; max_stock: number }[]
  >([]);

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim().toLowerCase();
    const match = productsData?.items.find(
      (p) =>
        (p.part_number && p.part_number.toLowerCase() === code) ||
        p.model.toLowerCase() === code ||
        p.name.toLowerCase().includes(code)
    );
    if (match) {
      setSelectedProductId(match.id);
      setUnitPrice(Number(match.price));
      setSaleQuantity(1);
      setFeedback({ type: 'success', text: `Scanned & selected: ${match.name} (${match.model})` });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      alert(`No battery found matching barcode "${scannedCode}"`);
    }
  };

  // Fetch sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['admin-sales', { search, statusFilter, startDate, endDate, page }],
    queryFn: () =>
      fetchAdminSales({
        search: search || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        page,
        size: 15,
      }),
  });

  // Fetch products for sale selector
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-sales-selector'],
    queryFn: () => fetchAdminProducts({ size: 100 }),
  });

  // Record Sale Mutation
  const saleMutation = useMutation({
    mutationFn: () =>
      recordSale({
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        items: saleItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sales'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });

      setModalOpen(false);
      setSaleItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setFeedback({ type: 'success', text: 'Store sale recorded successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to record sale.' });
    },
  });

  // Cancel Sale Mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSale(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sales'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setFeedback({ type: 'success', text: 'Sale cancelled and inventory returned to stock.' });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = productsData?.items.find((p) => p.id === prodId);
    if (prod) {
      setUnitPrice(Number(prod.price));
      setSaleQuantity(1);
    }
  };

  const addItemToSale = () => {
    if (!selectedProductId) return;
    const prod = productsData?.items.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (saleQuantity > prod.quantity) {
      alert(`Cannot add ${saleQuantity} units. Only ${prod.quantity} available in stock!`);
      return;
    }

    setSaleItems((prev) => [
      ...prev,
      {
        product_id: prod.id,
        product_name: `${prod.name} (${prod.model})`,
        quantity: saleQuantity,
        unit_price: unitPrice,
        max_stock: prod.quantity,
      },
    ]);

    setSelectedProductId('');
    setSaleQuantity(1);
    setUnitPrice(0);
  };

  const totalSaleAmount = saleItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(salesData?.total_revenue || 0));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Store Sales Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record manual battery sales, deduct warehouse stock atomically, and track revenue history.
          </p>
        </div>

        <button
          onClick={() => {
            setSaleItems([]);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition"
        >
          <Receipt className="w-4 h-4" />
          <span>Record New Sale</span>
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

      {/* Revenue Card & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Filtered Total Sales Revenue
            </span>
            <p className="text-2xl font-bold font-display text-slate-900">
              {formattedRevenue}
            </p>
            <span className="text-[11px] text-slate-400">
              {salesData?.total || 0} transactions
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="md:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap gap-2.5 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search customer, phone, or sale ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-300 rounded-md text-slate-600"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-300 rounded-md text-slate-600"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Sale Date & ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Sold Batteries</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Notes</th>
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
              ) : salesData?.items && salesData.items.length > 0 ? (
                salesData.items.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">#{sale.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{sale.customer_name || 'Walk-in Customer'}</p>
                      <p className="text-[11px] text-slate-400">{sale.customer_phone || 'No phone'}</p>
                    </td>
                    <td className="py-3 px-3 space-y-1">
                      {sale.items?.map((item) => (
                        <div key={item.id} className="text-[11px] text-slate-700">
                          <span className="font-semibold">{item.quantity}x</span> {item.product_name}
                          <span className="text-slate-400 ml-1">(₹{Number(item.unit_price).toLocaleString('en-IN')})</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 font-bold font-display text-sm text-slate-900">
                      ₹{Number(sale.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[11px]">
                      {sale.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sale.status === 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            const r = prompt('Reason for cancelling this sale and restoring stock?');
                            if (r && r.trim()) {
                              cancelMutation.mutate({ id: sale.id, reason: r.trim() });
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200 transition"
                        >
                          Cancel & Restore
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sales recorded yet. Use the "Record New Sale" button above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <span>Record Store Battery Sale</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sunil Verma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Phone (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Product Selector Row */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Add Battery to Invoice
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none text-xs"
                >
                  <option value="">-- Choose Battery Model from Inventory --</option>
                  {productsData?.items.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                      {p.name} ({p.model} {p.part_number ? `• Part #${p.part_number}` : ''}) — In Stock: {p.quantity} units (₹{p.price})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setBarcodeModalOpen(true)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition"
                  title="Scan Battery Barcode to Auto-Select"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span>Scan</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-semibold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addItemToSale}
                disabled={!selectedProductId}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg font-semibold text-xs"
              >
                + Add Battery Item
              </button>
            </div>

            {/* Items List */}
            {saleItems.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Invoice Items</label>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                  {saleItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{item.product_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} x ₹{item.unit_price} = ₹{item.quantity * item.unit_price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center text-xs font-bold">
                  <span className="text-amber-900">Total Invoice Amount:</span>
                  <span className="font-display text-base text-amber-900 font-extrabold">
                    ₹{totalSaleAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Installation Details</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Old battery exchanged, warranty card number, customer vehicle info..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saleItems.length === 0 || saleMutation.isPending}
                onClick={() => saleMutation.mutate()}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                {saleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Record Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Barcode Scanner Modal for Sales */}
      <BarcodeScannerModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Battery to Add to Sale"
        subtitle="Point camera at the battery's barcode or serial label"
      />
    </div>
  );
};

