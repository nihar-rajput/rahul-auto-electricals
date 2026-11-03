import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductPublic } from '../types';

const mockProduct: ProductPublic = {
  id: 'test-1',
  name: 'PowerZone PZ-38B20R Car Battery',
  slug: 'powerzone-pz-38b20r-car-battery',
  brand: { id: 'b1', name: 'PowerZone', slug: 'powerzone', is_active: true },
  model: 'PZ-38B20R',
  part_number: 'PZ38B20R-IND',
  battery_type: 'Car',
  price: 4199,
  voltage: '12V',
  ah_capacity: '35Ah',
  warranty_duration: '48 Months',
  guarantee_details: '24 Months Replacement',
  is_in_stock: true,
  stock_status_text: 'In Stock',
  display_quantity: null,
  images: [],
  compatibilities: [],
};

describe('ProductCard component', () => {
  it('renders product details and price correctly', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('PowerZone PZ-38B20R Car Battery')).toBeInTheDocument();
    expect(screen.getByText('PZ-38B20R')).toBeInTheDocument();
    expect(screen.getByText('12V')).toBeInTheDocument();
    expect(screen.getByText('35Ah')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText(/4,199/)).toBeInTheDocument();
  });

  it('displays exact quantity when configured in visibility mode', () => {
    const productWithExactQty: ProductPublic = {
      ...mockProduct,
      stock_status_text: '12 units available',
      display_quantity: 12,
    };

    render(
      <BrowserRouter>
        <ProductCard product={productWithExactQty} />
      </BrowserRouter>
    );

    expect(screen.getByText('12 units available')).toBeInTheDocument();
    expect(screen.getByText('Qty: 12')).toBeInTheDocument();
  });
});

