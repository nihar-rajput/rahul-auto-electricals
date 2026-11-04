import axios from 'axios';
import {
  Brand,
  ProductCategory,
  Vehicle,
  ProductPublic,
  ProductAdmin,
  InventoryMovement,
  Sale,
  CustomerEnquiry,
  WebsiteSettings,
  AdminUser,
  TokenResponse,
  PaginatedResponse,
  DashboardStats,
} from '../types';

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) {
    return '/api/v1';
  }
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

/* ==================== Public Endpoints ==================== */

export const fetchPublicProducts = async (params: {
  search?: string;
  battery_type?: string;
  brand?: string;
  in_stock?: boolean;
  price_min?: number;
  price_max?: number;
  sort_by?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<ProductPublic>> => {
  const { data } = await apiClient.get<PaginatedResponse<ProductPublic>>('/products', { params });
  return data;
};

export const fetchProductBySlug = async (slug: string): Promise<ProductPublic> => {
  const { data } = await apiClient.get<ProductPublic>(`/products/${slug}`);
  return data;
};

export const fetchBrands = async (): Promise<Brand[]> => {
  const { data } = await apiClient.get<Brand[]>('/brands');
  return data;
};

export const fetchCategories = async (): Promise<ProductCategory[]> => {
  const { data } = await apiClient.get<ProductCategory[]>('/categories');
  return data;
};

export const fetchVehicleManufacturers = async (): Promise<string[]> => {
  const { data } = await apiClient.get<string[]>('/vehicles/manufacturers');
  return data;
};

export const fetchVehicleModels = async (manufacturer: string): Promise<string[]> => {
  const { data } = await apiClient.get<string[]>('/vehicles/models', { params: { manufacturer } });
  return data;
};

export const fetchCompatibleBatteries = async (params: {
  manufacturer: string;
  model: string;
  year?: number;
}): Promise<ProductPublic[]> => {
  const { data } = await apiClient.get<ProductPublic[]>('/vehicles/compatible-batteries', { params });
  return data;
};

export const fetchPublicSettings = async (): Promise<WebsiteSettings> => {
  const { data } = await apiClient.get<WebsiteSettings>('/settings/public');
  return data;
};

export const submitEnquiry = async (enquiry: Partial<CustomerEnquiry>): Promise<CustomerEnquiry> => {
  const { data } = await apiClient.post<CustomerEnquiry>('/enquiries', enquiry);
  return data;
};

export const submitContactMessage = async (messageData: Partial<CustomerEnquiry>): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/contact', messageData);
  return data;
};

/* ==================== Auth Endpoints ==================== */

export const loginAdmin = async (credentials: { email: string; password: string }): Promise<TokenResponse> => {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials);
  return data;
};

export const fetchCurrentUser = async (): Promise<AdminUser> => {
  const { data } = await apiClient.get<AdminUser>('/auth/me');
  return data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token: string, new_password: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', { token, new_password });
  return data;
};

/* ==================== Admin Dashboard Endpoints ==================== */

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
  return data;
};

export const fetchAdminProducts = async (params?: {
  search?: string;
  category_id?: string;
  brand_id?: string;
  battery_type?: string;
  stock_status?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<ProductAdmin>> => {
  const { data } = await apiClient.get<PaginatedResponse<ProductAdmin>>('/admin/products', { params });
  return data;
};

export const createAdminProduct = async (productData: Partial<ProductAdmin>): Promise<ProductAdmin> => {
  const { data } = await apiClient.post<ProductAdmin>('/admin/products', productData);
  return data;
};

export const updateAdminProduct = async (id: string, productData: Partial<ProductAdmin>): Promise<ProductAdmin> => {
  const { data } = await apiClient.put<ProductAdmin>(`/admin/products/${id}`, productData);
  return data;
};

export const deleteAdminProduct = async (id: string): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/products/${id}`);
  return data;
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ image_url: string }>('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.image_url;
};

export const importProductsCsv = async (file: File): Promise<{ created: number; updated: number; errors: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ created: number; updated: number; errors: string[] }>('/admin/products/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/* ==================== Admin Inventory Endpoints ==================== */

export const fetchInventorySummary = async (): Promise<{
  total_products: number;
  total_stock_units: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
}> => {
  const { data } = await apiClient.get('/admin/inventory');
  return data;
};

export const adjustStock = async (adjustment: {
  product_id: string;
  movement_type: 'RESTOCK' | 'MANUAL_REMOVAL' | 'CORRECTION';
  quantity_change: number;
  reason: string;
}): Promise<InventoryMovement> => {
  const { data } = await apiClient.post<InventoryMovement>('/admin/inventory/adjust', adjustment);
  return data;
};

export const fetchInventoryMovements = async (params?: {
  product_id?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<InventoryMovement>> => {
  const { data } = await apiClient.get<PaginatedResponse<InventoryMovement>>('/admin/inventory/movements', { params });
  return data;
};

/* ==================== Admin Sales Endpoints ==================== */

export const fetchAdminSales = async (params?: {
  search?: string;
  status_filter?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<Sale> & { total_revenue: number }> => {
  const { data } = await apiClient.get('/admin/sales', { params });
  return data;
};

export const recordSale = async (saleData: {
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  items: { product_id: string; quantity: number; unit_price: number; part_number?: string }[];
}): Promise<Sale> => {
  const { data } = await apiClient.post<Sale>('/admin/sales', saleData);
  return data;
};

export const cancelSale = async (saleId: string, reason: string): Promise<Sale> => {
  const { data } = await apiClient.post<Sale>(`/admin/sales/${saleId}/cancel`, { reason });
  return data;
};

/* ==================== Admin Enquiries Endpoints ==================== */

export const fetchAdminEnquiries = async (params?: {
  status_filter?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<CustomerEnquiry>> => {
  const { data } = await apiClient.get<PaginatedResponse<CustomerEnquiry>>('/admin/enquiries', { params });
  return data;
};

export const fetchEnquiryStats = async (): Promise<{ new: number; contacted: number; completed: number; total: number }> => {
  const { data } = await apiClient.get('/admin/enquiries/stats');
  return data;
};

export const updateEnquiry = async (id: string, updateData: { status?: string; admin_notes?: string }): Promise<CustomerEnquiry> => {
  const { data } = await apiClient.patch<CustomerEnquiry>(`/admin/enquiries/${id}`, updateData);
  return data;
};

export const deleteEnquiry = async (id: string): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/enquiries/${id}`);
  return data;
};

/* ==================== Admin Users Endpoints ==================== */

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await apiClient.get<AdminUser[]>('/admin/users');
  return data;
};

export const createAdminUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  is_active: boolean;
}): Promise<AdminUser> => {
  const { data } = await apiClient.post<AdminUser>('/admin/users', userData);
  return data;
};

export const updateAdminUser = async (id: string, userData: Partial<AdminUser> & { password?: string }): Promise<AdminUser> => {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}`, userData);
  return data;
};

export const deleteAdminUser = async (id: string): Promise<{ message: string }> => {
  const { data } = await apiClient.delete<{ message: string }>(`/admin/users/${id}`);
  return data;
};

/* ==================== Admin Settings Endpoints ==================== */

export const fetchAdminSettings = async (): Promise<WebsiteSettings> => {
  const { data } = await apiClient.get<WebsiteSettings>('/admin/settings');
  return data;
};

export const updateAdminSettings = async (settingsData: Partial<WebsiteSettings>): Promise<WebsiteSettings> => {
  const { data } = await apiClient.put<WebsiteSettings>('/admin/settings', settingsData);
  return data;
};

export const getExportProductsCsvUrl = () => {
  return `${API_BASE_URL}/admin/products/export/csv`;
};

