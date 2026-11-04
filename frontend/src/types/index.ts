export interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  logo_url?: string | null;
  description?: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
}

export interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  year?: number | null;
  fuel_type?: string | null;
}

export interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVehicleCompatibility {
  id: string;
  vehicle_id: string;
  compatible_from_year?: number | null;
  compatible_to_year?: number | null;
  notes?: string | null;
  vehicle?: Vehicle | null;
}

export interface ProductPublic {
  id: string;
  name: string;
  slug: string;
  brand?: Brand | null;
  category?: ProductCategory | null;
  model: string;
  part_number?: string | null;
  battery_type: 'Car' | 'Bike' | 'Truck' | 'Inverter' | 'Commercial' | 'Other';
  description?: string | null;
  price: string | number;
  voltage?: string | null;
  ah_capacity?: string | null;
  warranty_duration?: string | null;
  guarantee_details?: string | null;
  is_in_stock: boolean;
  stock_status_text: string;
  display_quantity?: number | null;
  images: ProductImage[];
  compatibilities: ProductVehicleCompatibility[];
}

export interface ProductAdmin {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  brand?: Brand | null;
  category_id: string;
  category?: ProductCategory | null;
  model: string;
  part_number?: string | null;
  battery_type: 'Car' | 'Bike' | 'Truck' | 'Inverter' | 'Commercial' | 'Other';
  description?: string | null;
  price: string | number;
  quantity: number;
  voltage?: string | null;
  ah_capacity?: string | null;
  warranty_duration?: string | null;
  guarantee_details?: string | null;
  low_stock_threshold: number;
  stock_visibility_mode?: 'EXACT_QUANTITY' | 'SIMPLE_STATUS' | 'STOCK_LEVEL' | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  images: ProductImage[];
  compatibilities: ProductVehicleCompatibility[];
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string | null;
  product_model?: string | null;
  admin_id?: string | null;
  admin_name?: string | null;
  movement_type: 'RESTOCK' | 'SALE' | 'MANUAL_REMOVAL' | 'CORRECTION' | 'SALE_CANCELLATION';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name?: string | null;
  product_model?: string | null;
  part_number?: string | null;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

export interface Sale {
  id: string;
  admin_id?: string | null;
  admin_name?: string | null;
  sale_date: string;
  total_amount: string | number;
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  status: 'COMPLETED' | 'CANCELLED';
  created_at: string;
  items: SaleItem[];
}

export interface CustomerEnquiry {
  id: string;
  customer_name: string;
  phone: string;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: string | null;
  battery_type?: string | null;
  preferred_brand?: string | null;
  message?: string | null;
  status: 'NEW' | 'CONTACTED' | 'COMPLETED' | 'CANCELLED';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  id?: string;
  business_name: string;
  business_phone: string;
  whatsapp_number: string;
  business_address: string;
  opening_hours: string;
  maps_url: string;
  default_stock_visibility_mode: 'EXACT_QUANTITY' | 'SIMPLE_STATUS' | 'STOCK_LEVEL';
  default_low_stock_threshold: number;
  default_language: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AdminUser;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DashboardStats {
  total_products: number;
  total_stock_units: number;
  out_of_stock_count: number;
  low_stock_count: number;
  total_sales_count: number;
  total_sales_revenue: number;
  new_enquiries_count: number;
  recent_enquiries: CustomerEnquiry[];
}

