import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RequestBatteryPage } from '../pages/RequestBatteryPage';

describe('RequestBatteryPage Enquiry Form', () => {
  it('renders all required form input fields', () => {
    render(
      <BrowserRouter>
        <RequestBatteryPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/e\.g\. Rahul Sharma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. \+91 98765 43210/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Maruti Suzuki, Hyundai/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Swift, Creta/i)).toBeInTheDocument();
  });
});

