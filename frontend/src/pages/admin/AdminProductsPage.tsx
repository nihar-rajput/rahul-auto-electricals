import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BatteryCharging,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Car,
  ScanBarcode,
  Camera as CameraIcon,
  FileSpreadsheet,
} from 'lucide-react';
import { BarcodeScannerModal } from '../../components/BarcodeScannerModal';
import { CameraCaptureModal } from '../../components/CameraCaptureModal';
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchBrands,
  fetchCategories,
  uploadProductImage,
  importProductsCsv,
  getExportProductsCsvUrl,
  fetchVehicleManufacturers,
  fetchVehicleModels,
  apiClient,
} from '../../services/api';
import { ProductAdmin, Brand, ProductCategory, Vehicle } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ProductAdmin>>({
    name: '',
    brand_id: '',
    category_id: '',
    model: '',
    part_number: '',
    battery_type: 'Car',
    description: '',
    price: '' as any,
    quantity: '' as any,
    voltage: '12V',
    ah_capacity: '',
    warranty_duration: '',
    guarantee_details: '',
    low_stock_threshold: '' as any,
    stock_visibility_mode: 'SIMPLE_STATUS',
    is_published: true,
    images: [],
    compatibilities: [],
  });

  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Barcode & Camera scanner states
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeTargetField, setBarcodeTargetField] = useState<'search' | 'part_number' | 'model'>('part_number');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  // Fetch Products
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search, stockStatus, page }],
    queryFn: () =>
      fetchAdminProducts({
        search: search || undefined,
        stock_status: stockStatus !== 'all' ? stockStatus : undefined,
        page,
        size: 15,
      }),
  });

  // Fetch Brands & Categories for selectors
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: (dataToSave: Partial<ProductAdmin>) => {
      if (editingProduct) {
        return updateAdminProduct(editingProduct.id, dataToSave);
      }
      return createAdminProduct(dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setModalOpen(false);
      setEditingProduct(null);
      setFeedback({
        type: 'success',
        text: `Product ${editingProduct ? 'updated' : 'created'} successfully!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to save product.',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setFeedback({ type: 'success', text: 'Product deleted successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand_id: brands[0]?.id || '',
      category_id: categories[0]?.id || '',
      model: '',
      part_number: '',
      battery_type: 'Car',
      description: '',
      price: '' as any,
      quantity: '' as any,
      voltage: '12V',
      ah_capacity: '',
      warranty_duration: '48 Months (24 Free + 24 Pro-rata)',
      guarantee_details: '24 Months Replacement',
      low_stock_threshold: '' as any,
      stock_visibility_mode: 'SIMPLE_STATUS',
      is_published: true,
      images: [],
      compatibilities: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (prod: ProductAdmin) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      brand_id: prod.brand_id,
      category_id: prod.category_id,
      model: prod.model,
      part_number: prod.part_number || '',
      battery_type: prod.battery_type,
      description: prod.description || '',
      price: Number(prod.price),
      quantity: prod.quantity,
      voltage: prod.voltage || '12V',
      ah_capacity: prod.ah_capacity || '',
      warranty_duration: prod.warranty_duration || '',
      guarantee_details: prod.guarantee_details || '',
      low_stock_threshold: prod.low_stock_threshold,
      stock_visibility_mode: prod.stock_visibility_mode || 'SIMPLE_STATUS',
      is_published: prod.is_published,
      images: prod.images || [],
      compatibilities: prod.compatibilities || [],
    });
    setModalOpen(true);
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadLoading(true);
    try {
      const url = await uploadProductImage(file);
      setFormData((prev) => ({
        ...prev,
        images: [
          ...(prev.images || []),
          { id: '', image_url: url, is_primary: (prev.images?.length || 0) === 0, display_order: prev.images?.length || 0 },
        ],
      }));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Image upload failed');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [
        ...(prev.images || []),
        { id: '', image_url: imageUrlInput.trim(), is_primary: (prev.images?.length || 0) === 0, display_order: prev.images?.length || 0 },
      ],
    }));
    setImageUrlInput('');
  };

  const handleOpenBarcodeScanner = (target: 'search' | 'part_number' | 'model') => {
    setBarcodeTargetField(target);
    setBarcodeModalOpen(true);
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    if (barcodeTargetField === 'search') {
      setSearch(scannedCode);
      setPage(1);
    } else if (barcodeTargetField === 'part_number') {
      setFormData((prev) => ({ ...prev, part_number: scannedCode }));
    } else if (barcodeTargetField === 'model') {
      setFormData((prev) => ({ ...prev, model: scannedCode }));
    }
  };

  const handleCameraPhotoCaptured = async (file: File) => {
    setImageUploadLoading(true);
    try {
      const url = await uploadProductImage(file);
      setFormData((prev) => ({
        ...prev,
        images: [
          ...(prev.images || []),
          { id: '', image_url: url, is_primary: (prev.images?.length || 0) === 0, display_order: prev.images?.length || 0 },
        ],
      }));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Photo upload failed');
    } finally {
      setImageUploadLoading(false);
    }
  };

  // CSV Import handler
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploadLoading(true);
    try {
      const res = await importProductsCsv(file);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      alert(`CSV Import Complete: ${res.created} products created, ${res.updated} updated.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'CSV Import failed.');
    } finally {
      setCsvUploadLoading(false);
      e.target.value = '';
    }
  };

  const handleExportCsv = () => {
    const url = getExportProductsCsvUrl();
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'Brand',
      'Category',
      'Model',
      'Part Number',
      'Battery Type',
      'Price',
      'Quantity',
      'Voltage',
      'Ah Capacity',
      'Warranty',
      'Guarantee Details',
      'Low Stock Threshold',
      'Stock Visibility Mode',
      'Is Published',
      'Description',
    ];
    const sampleRows = [
      [
        'PowerZone PZ-38B20R Car Battery (35Ah)',
        'PowerZone',
        'Batteries',
        'PZ-38B20R',
        'PZ-38B-2026-0001',
        'Car',
        '3499.00',
        '15',
        '12V',
        '35 Ah',
        '48 Months (24 Free + 24 Pro-rata)',
        '24 Months Free Replacement',
        '5',
        'EXACT_COUNT',
        'TRUE',
        'Maintenance-free car battery for Maruti Suzuki, Hyundai, and Tata compact cars.',
      ],
      [
        'Amaron Pro Rider 5Ah Two-Wheeler Battery',
        'Amaron',
        'Batteries',
        'AP-BTZ5',
        'AM-5AH-2026-0012',
        'Bike',
        '1350.00',
        '25',
        '12V',
        '5 Ah',
        '48 Months (24 Free + 24 Pro-rata)',
        '24 Months Free Replacement',
        '8',
        'EXACT_COUNT',
        'TRUE',
        'VRLA factory charged bike battery for Honda Activa, Hero Splendor, and Bajaj Pulsar.',
      ],
      [
        'Exide Inva Tubular 150Ah Inverter Battery',
        'Exide',
        'Batteries',
        'IT500',
        'EX-150-2026-0099',
        'Inverter',
        '14500.00',
        '6',
        '12V',
        '150 Ah',
        '60 Months (36 Free + 24 Pro-rata)',
        '36 Months Free Replacement',
        '2',
        'EXACT_COUNT',
        'TRUE',
        'Heavy duty tall tubular deep cycle battery for domestic home and office inverter backup.',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rahul_auto_battery_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.model || !formData.brand_id || !formData.category_id) {
      alert('Please fill out all required fields');
      return;
    }
    const payload = {
      ...formData,
      price: !formData.price || String(formData.price).trim() === '' ? 0 : Number(formData.price),
      quantity: !formData.quantity || String(formData.quantity).trim() === '' ? 0 : Number(formData.quantity),
      low_stock_threshold:
        !formData.low_stock_threshold || String(formData.low_stock_threshold).trim() === ''
          ? 5
          : Number(formData.low_stock_threshold),
    };
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Product Catalog Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, import, and configure automobile battery products and technical fitments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Sample Template */}
          <button
            onClick={handleDownloadTemplate}
            title="Download sample Excel/CSV template with real battery rows"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
            <span>Sample Template</span>
          </button>

          {/* CSV Import */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{csvUploadLoading ? 'Importing...' : 'Import CSV'}</span>
            <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" disabled={csvUploadLoading} />
          </label>

          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Battery</span>
          </button>
        </div>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, model, part no., barcode..."
            className="w-full pl-9 pr-24 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            type="button"
            onClick={() => handleOpenBarcodeScanner('search')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
            title="Scan Battery Barcode to Search"
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Product Name & Model</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Stock Units</th>
                <th className="py-3 px-3">Visibility Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading catalog inventory...</span>
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                          {prod.images?.[0]?.image_url ? (
                            <img src={prod.images[0].image_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <BatteryCharging className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-snug">{prod.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Model: {prod.model}
                            </span>
                            {prod.part_number && (
                              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ScanBarcode className="w-2.5 h-2.5 text-amber-600" />
                                Part/Barcode: {prod.part_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-amber-600">{prod.brand?.name || 'PowerZone'}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{prod.battery_type}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 font-display text-sm">
                      ₹{Number(prod.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          prod.quantity <= 0
                            ? 'bg-red-50 text-red-700'
                            : prod.quantity <= prod.low_stock_threshold
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {prod.quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 font-mono">
                      {prod.stock_visibility_mode || 'Default'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          prod.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prod.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${prod.name}? Stock movements will be preserved.`)) {
                            deleteMutation.mutate(prod.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found. Add your first battery using the button above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {data.pages} ({data.total} total products)
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
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900 font-display">
                {editingProduct ? 'Edit Product Details' : 'Add New Automobile Battery'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. PowerZone PZ-38B20R Car Battery"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Brand, Category, Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand *</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Battery Type *</label>
                  <select
                    value={formData.battery_type}
                    onChange={(e) => setFormData({ ...formData, battery_type: e.target.value as any })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Car">Car Battery</option>
                    <option value="Bike">Bike Battery</option>
                    <option value="Truck">Truck Battery</option>
                    <option value="Inverter">Inverter Battery</option>
                    <option value="Commercial">Commercial Vehicle</option>
                    <option value="Other">Other Type</option>
                  </select>
                </div>
              </div>

              {/* Model & Part Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-800 text-xs">Model Number *</label>
                    <span className="text-[10px] text-slate-500 font-medium">Shared across same spec</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. PZ-38B20R, DIN55"
                      required
                      className="w-full pl-3 pr-20 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenBarcodeScanner('model')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Scan Model Barcode"
                    >
                      <ScanBarcode className="w-3.5 h-3.5 text-amber-600" />
                      <span>Scan</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">General battery line (e.g., PZ-38B20R)</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-800 text-xs">Part Number / Serial Barcode</label>
                    <span className="text-[10px] text-amber-700 font-bold">Unique per product</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.part_number || ''}
                      onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                      placeholder="e.g. PZ38B-2026-0041"
                      className="w-full pl-3 pr-20 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenBarcodeScanner('part_number')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                      title="Scan Unique Battery Barcode"
                    >
                      <ScanBarcode className="w-3.5 h-3.5" />
                      <span>Scan</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Individual unit barcode for tracking stock</p>
                </div>
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price ?? ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? ('' as any) : e.target.value })}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '0.00') {
                        e.target.select();
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.quantity ?? ''}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? ('' as any) : e.target.value })}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.select();
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.low_stock_threshold ?? ''}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value === '' ? ('' as any) : e.target.value })}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '5') {
                        e.target.select();
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Specs: Voltage, Ah, Warranty, Guarantee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voltage</label>
                  <input
                    type="text"
                    value={formData.voltage || ''}
                    onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                    placeholder="e.g. 12V"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ah Capacity</label>
                  <input
                    type="text"
                    value={formData.ah_capacity || ''}
                    onChange={(e) => setFormData({ ...formData, ah_capacity: e.target.value })}
                    placeholder="e.g. 35Ah or 150Ah"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warranty Duration</label>
                  <input
                    type="text"
                    value={formData.warranty_duration || ''}
                    onChange={(e) => setFormData({ ...formData, warranty_duration: e.target.value })}
                    placeholder="e.g. 48 Months (24 Free + 24 Pro-rata)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guarantee Details</label>
                  <input
                    type="text"
                    value={formData.guarantee_details || ''}
                    onChange={(e) => setFormData({ ...formData, guarantee_details: e.target.value })}
                    placeholder="e.g. 24 Months Replacement"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Stock Visibility Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Visibility Mode</label>
                  <select
                    value={formData.stock_visibility_mode || 'SIMPLE_STATUS'}
                    onChange={(e) => setFormData({ ...formData, stock_visibility_mode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="SIMPLE_STATUS">SIMPLE_STATUS ("In Stock" / "Out of Stock")</option>
                    <option value="EXACT_QUANTITY">EXACT_QUANTITY ("12 units available")</option>
                    <option value="STOCK_LEVEL">STOCK_LEVEL ("Low Stock" / "In Stock")</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Publish in Public Catalog</span>
                  </label>
                </div>
              </div>

              {/* Image Upload Box */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Images</label>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Live Web Camera Viewfinder */}
                  <button
                    type="button"
                    onClick={() => setCameraModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition font-bold text-xs shadow-xs"
                    title="Open Live Camera Viewfinder to Snap Photo"
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span>Snap Photo</span>
                  </button>

                  {/* Native Mobile Camera Button */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition font-medium text-xs">
                    <CameraIcon className="w-4 h-4 text-slate-600" />
                    <span>Phone Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={imageUploadLoading}
                    />
                  </label>

                  {/* Regular File Upload */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition font-medium text-xs">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>{imageUploadLoading ? 'Uploading...' : 'Upload File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" disabled={imageUploadLoading} />
                  </label>

                  <span className="text-xs text-slate-400">or</span>

                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {formData.images?.length || 0} image(s) attached. You can take live photos with your webcam or mobile camera.
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded border overflow-hidden group">
                        <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              images: prev.images?.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="absolute inset-0 bg-red-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Battery features, alloy composition, vibration resistance..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        onScan={handleBarcodeScanned}
        title={
          barcodeTargetField === 'search'
            ? 'Scan Battery Barcode to Search'
            : barcodeTargetField === 'part_number'
            ? 'Scan Part Number / Serial Barcode'
            : 'Scan Model Number Barcode'
        }
        subtitle="Point camera at any 1D/2D battery barcode, QR code, or serial label"
      />

      {/* Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraPhotoCaptured}
      />
    </div>
  );
};

