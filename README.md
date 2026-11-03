# Rahul Auto Electricals — Online Battery Inventory & Product Catalog

Production-ready, responsive website and secure inventory management system for **Rahul Auto Electricals**, an automotive electricals and battery retailer featuring **PowerZone** batteries (alongside Exide, Amaron, and other major brands).

---

## 1. Architecture & Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS (custom automotive theme, clean white background, responsive)
- **Routing**: React Router v6
- **Server State**: TanStack Query (React Query v5)
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Internationalization (i18n)**: `i18next` with bilingual support (**English & Hindi**) and persistent language preferences

### Backend
- **Framework**: Python 3.11+ FastAPI (RESTful API, asynchronous architecture)
- **Validation & Schemas**: Pydantic v2 & Pydantic Settings
- **ORM & Database**: SQLAlchemy 2.0 with connection pooling
- **Migrations**: Alembic
- **Authentication**: JWT access & refresh tokens with Bcrypt password hashing
- **Security**: Role-Based Access Control (`SUPER_ADMIN` and `ADMIN`), CORS configuration, Rate Limiting (`slowapi`), SQL-injection protection, negative inventory guards
- **Image Storage**: Cloudinary integration with safe fallback
- **Automated Tests**: Pytest & HTTPX (backend), Vitest & React Testing Library (frontend)

### Database
- **PostgreSQL** (production deployment on **Supabase**; fully compatible with SQLite for lightweight local testing)

---

## 2. Key Features

### Public Customer Portal
1. **Home Page**:
   - Modern hero section with call-to-actions (Catalog, WhatsApp chat, Phone dialer).
   - Instant search bar querying battery names, models, part numbers, and vehicle compatibility.
   - **Vehicle Compatibility Finder Widget**: Select Make (e.g. Maruti Suzuki, Hyundai, Tata) → Select Model (Swift, Nexon, Creta) → Select Year → View guaranteed OEM fitment batteries.
   - Featured batteries grid & authorized brand highlights (PowerZone).
   - Category exploration: Car, Two-Wheeler (Bike), Truck, Tall Tubular Inverter, and Commercial Vehicles.
   - Store address, operating hours, and Google Maps directions.
2. **Battery Catalog Page**:
   - Live multi-criteria filtering: Battery Type, Brand, Price Range, and Stock Availability.
   - Multi-field search (model, name, part number, vehicle).
   - Sorting by Price (Low to High, High to Low), Name (A-Z), and Newest.
   - Product cards displaying M.R.P. in INR (₹), brand, model, specs, stock status, and direct WhatsApp enquiry.
   - Server-side pagination.
3. **Product Detail Page**:
   - High-resolution product images.
   - Detailed specifications: Voltage, Ah Capacity, Warranty, Guarantee details, and Description.
   - List of verified compatible vehicles with manufacturing year ranges.
   - Dynamic stock status governed by visibility rules.
   - One-click **Enquire on WhatsApp** button with dynamic pre-filled text.
4. **Request a Battery Page**:
   - Customer enquiry form with full frontend (Zod) and backend validation.
   - Customers submit requirements without registering or logging in.
   - Saves enquiry to PostgreSQL, provides instant confirmation, and offers direct WhatsApp follow-up.
5. **Contact Page**:
   - Interactive contact enquiry form.
   - Store address, customer support phone number, WhatsApp number, opening hours, and Google Maps directions (all editable by admin in website settings).
6. **Bilingual English & Hindi Support**:
   - Switch languages anytime from the navbar.
   - All navigation items, hero titles, buttons, status badges, forms, and system labels are translated.
7. **Floating WhatsApp Action**:
   - Dynamic click-to-chat button with properly URL-encoded pre-filled messages.

### Secure Admin Management Portal
1. **Authentication & Roles**:
   - Dedicated admin portal (`/admin/login`).
   - Secure initial Super Admin setup CLI command (no hardcoded credentials or public registration).
   - Roles: `SUPER_ADMIN` (full system privileges) and `ADMIN` (products, stock, sales, enquiries).
   - Password reset workflow with secure reset tokens.
2. **Admin Overview Dashboard**:
   - Real-time statistics: Total Products, Available Stock Units, Low-Stock items, Out-of-Stock count, Total Sales Revenue, and Pending Leads.
   - Notification badges for new customer enquiries.
   - Recent enquiries table with quick WhatsApp and phone actions.
3. **Product Management (CRUD)**:
   - Create, edit, and soft-delete products.
   - Required & optional battery specifications: Part Number, Voltage, Ah Capacity, Warranty Duration, Guarantee Details.
   - Assign vehicle compatibilities with year ranges (`from_year` to `to_year`).
   - Upload product images to Cloudinary (or local fallback).
   - **CSV Import & CSV Export**: Bulk upload or backup the battery inventory.
4. **Stock & Inventory Auditing**:
   - Add/remove stock, record restocks, and log physical inventory corrections.
   - **Immutable Inventory Audit Log (`InventoryMovement`)**: Every stock change records product ID, admin ID, movement type (`RESTOCK`, `SALE`, `MANUAL_REMOVAL`, `CORRECTION`, `SALE_CANCELLATION`), quantity change, previous quantity, new quantity, mandatory reason, and timestamp.
   - Guaranteed non-negative inventory protection in database transactions.
5. **Stock Visibility Configuration**:
   - 3 Visibility Modes:
     - `EXACT_QUANTITY` (e.g., "12 units available")
     - `SIMPLE_STATUS` (e.g., "In Stock" or "Out of Stock")
     - `STOCK_LEVEL` (e.g., "Low Stock", "In Stock", or "Out of Stock")
   - Configurable global default in settings + optional per-product override.
   - Configurable low-stock thresholds.
6. **Sales Management**:
   - Record manual counter sales with product selection, quantity, and unit price.
   - Validates available stock, atomically updates product quantity, and logs `SALE` movement.
   - Search sales history and filter by date range.
   - **Controlled Sale Cancellation**: Reverses sold stock back into inventory and generates `SALE_CANCELLATION` audit entries.
7. **Customer Enquiry Management**:
   - View, search, and filter enquiries by status (`NEW`, `CONTACTED`, `COMPLETED`, `CANCELLED`).
   - Edit internal admin notes.
   - Direct WhatsApp message generation and phone calling shortcuts.
8. **Admin User Management** (Super Admin only):
   - Create new administrator accounts.
   - Activate / deactivate accounts.
9. **Website Settings Management** (Super Admin only):
   - Edit business contact details, WhatsApp number, store address, opening hours, and Google Maps URL.
   - Configure default stock visibility mode and low-stock threshold.

---

## 3. Project Structure

```text
Rahul Auto Electricals/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py              # Login, token refresh, password reset
│   │   │       │   ├── products.py          # Public products & catalog
│   │   │       │   ├── vehicles.py          # Vehicle search & compatibility
│   │   │       │   ├── public_enquiries.py  # Public enquiry & contact submissions
│   │   │       │   ├── settings.py          # Public website settings
│   │   │       │   ├── admin_dashboard.py   # Overview statistics
│   │   │       │   ├── admin_products.py    # Product CRUD, CSV import/export
│   │   │       │   ├── admin_inventory.py   # Stock adjustment & movement logs
│   │   │       │   ├── admin_sales.py       # Sales recording & cancellation
│   │   │       │   ├── admin_enquiries.py   # Enquiry status & notes
│   │   │       │   ├── admin_users.py       # Admin account creation (Super Admin)
│   │   │       │   ├── admin_settings.py    # Global settings configuration
│   │   │       │   └── upload.py            # Image upload handler
│   │   │       └── api.py                   # Master v1 router
│   │   ├── core/
│   │   │   ├── config.py                    # Environment settings (Pydantic BaseSettings)
│   │   │   ├── security.py                  # JWT encode/decode & Bcrypt password hashing
│   │   │   └── permissions.py               # Dependencies (get_current_user, require_super_admin)
│   │   ├── db/
│   │   │   ├── base.py                      # Declarative Base
│   │   │   └── session.py                   # Engine & connection pool
│   │   ├── models/                          # SQLAlchemy 2.0 ORM Models
│   │   │   ├── admin_user.py
│   │   │   ├── brand.py
│   │   │   ├── product_category.py
│   │   │   ├── product.py
│   │   │   ├── product_image.py
│   │   │   ├── vehicle.py
│   │   │   ├── product_vehicle_compatibility.py
│   │   │   ├── inventory_movement.py
│   │   │   ├── sale.py & sale_item.py
│   │   │   ├── customer_enquiry.py
│   │   │   └── website_settings.py
│   │   ├── schemas/                         # Pydantic v2 Request & Response schemas
│   │   ├── services/                        # Service layer (business logic & transactions)
│   │   ├── cli.py                           # CLI commands (create-superadmin, seed-data)
│   │   └── main.py                          # FastAPI application & middleware
│   ├── migrations/                          # Alembic database migrations
│   ├── tests/                               # Pytest test suite (11 automated tests)
│   ├── Dockerfile
│   ├── render.yaml                          # Render deployment spec
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/                      # Navbar, Footer, ProductCard, VehicleFinder, etc.
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CatalogPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── RequestBatteryPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── admin/                       # Admin dashboard pages
│   │   ├── services/                        # Axios API client with auth interceptors
│   │   ├── i18n/                            # English (en.json) & Hindi (hi.json) translations
│   │   ├── types/                           # TypeScript interfaces
│   │   ├── test/                            # Vitest & RTL test suite
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json                          # Vercel SPA routing
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml                       # Multi-container local development setup
├── .env.example
└── README.md
```

---

## 4. Getting Started Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL (or use the built-in SQLite development default)

### 4.1 Backend Setup

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment configuration file:
   ```bash
   cp .env.example .env
   ```
5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
6. Create the initial Super Admin account using the secure backend CLI:
   ```bash
   python -m app.cli create-superadmin --email admin@rahulautoelectricals.com --password "RahulAdmin@2026!" --name "Rahul Super Admin"
   ```
7. Seed initial catalog data (PowerZone batteries, vehicle mappings, website settings):
   ```bash
   python -m app.cli seed-data
   ```
8. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Interactive OpenAPI documentation is available at `http://localhost:8000/api/v1/docs`.

### 4.2 Frontend Setup

1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Start Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 5. Running Automated Tests

### Backend Tests (pytest)
Runs 11 automated tests covering authentication, authorization, product CRUD, search, vehicle compatibility, stock adjustments, negative inventory prevention, sale recording & cancellation, enquiry flows, and stock visibility modes:
```bash
cd backend
venv\Scripts\pytest.exe -v
```

### Frontend Tests (Vitest + React Testing Library)
Runs component and form tests:
```bash
cd frontend
npm test
```

### Production Build Verification
Verify TypeScript and Vite bundling:
```bash
cd frontend
npm run build
```

---

## 6. Running with Docker Compose

To run PostgreSQL, the FastAPI backend, and the React frontend in containers:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 7. Cloud Deployment Guide (Free Tier)

### 7.1 Database: Supabase PostgreSQL
1. Create a free project at [supabase.com](https://supabase.com).
2. Under **Project Settings → Database**, find your connection string URI:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
3. Set this connection string as the `DATABASE_URL` environment variable on your backend host.

### 7.2 Backend: Render
1. Create a free account at [render.com](https://render.com).
2. Click **New → Web Service** and connect your repository (root directory: `backend`).
3. Set the following build and start configurations:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Add the required Environment Variables in Render:
   - `DATABASE_URL`: Your Supabase connection string.
   - `SECRET_KEY`: A long, randomly generated secret string.
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend.vercel.app","http://localhost:5173"]`
   - `CLOUDINARY_CLOUD_NAME`: (Optional) Your Cloudinary cloud name.
   - `CLOUDINARY_API_KEY`: (Optional) Your Cloudinary API key.
   - `CLOUDINARY_API_SECRET`: (Optional) Your Cloudinary API secret.
5. Once deployed, run the Super Admin creation command using the Render shell:
   ```bash
   python -m app.cli create-superadmin --email admin@rahulautoelectricals.com --password "YourStrongPassword" --name "Rahul Super Admin"
   python -m app.cli seed-data
   ```

### 7.3 Frontend: Vercel
1. Create a free account at [vercel.com](https://vercel.com).
2. Click **Add New → Project** and import the repository.
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api/v1`
5. Click **Deploy**. Vercel will build and serve the single-page application with automatic SPA rewrites (`vercel.json`).

---

## 8. Architectural Extensibility for Auto Spare Parts

The database and backend services are intentionally designed to allow future expansion:
- The `ProductCategory` model supports hierarchical self-referential categories (`parent_id`), allowing categories such as `Auto Spare Parts`, `Electrical Relays`, `Alternators`, and `Starters`.
- The vehicle compatibility table (`ProductVehicleCompatibility`) is normalized and decoupled from battery-specific attributes, meaning any automobile spare part can be linked to vehicles without modifying core inventory or sales logic.

