# ShopEase — Full-Stack E-Commerce Website

A complete e-commerce platform built with **React + Vite**, **Flask + Python**, **MySQL**, **Tailwind CSS**, and **JWT Authentication**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS |
| Database | MySQL 8.0+ |
| Auth | JWT (JSON Web Tokens) |

## Features

**User side:** Home page, product listing with search/filter/sort, category browsing, product details, cart (add/update/remove), wishlist, registration & login, profile management, order history with cancellation, COD checkout — fully responsive.

**Admin side:** Admin login, dashboard with sales analytics (revenue charts, top products, order status breakdown), product CRUD with image upload, category CRUD, order management with status updates, user management (activate/deactivate).

---

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MySQL 8.0+ running locally (or accessible remotely)

---

## 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
```

This creates the `ecommerce_db` database, all 7 tables, and seeds sample categories/products plus a ready-to-use admin account:

- **Email:** `admin@example.com`
- **Password:** `Admin@123`

(Change this password after first login in production. To create additional admins, register a normal account through the app and run `UPDATE users SET role='admin' WHERE email='your@email.com';` in MySQL.)

---

## 2. Backend Setup

```bash
cd backend
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DB_PASSWORD, SECRET_KEY, JWT_SECRET_KEY to your own values

# Create tables (alternative to running schema.sql directly)
flask --app run.py init-db

# Run the server
python run.py
```

The API will be running at **http://localhost:5000**. Health check: `GET http://localhost:5000/api/health`

---

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install

cp .env.example .env
# Default VITE_API_BASE_URL=http://localhost:5000 works out of the box

npm run dev
```

The app will be running at **http://localhost:5173**

---

## 4. Using the App

- **Storefront:** http://localhost:5173
- **Admin panel:** http://localhost:5173/admin/login (log in with your admin account)

Register a normal account to test the user flow (browse → cart → checkout → order history), and use the admin account to manage products, categories, orders, and users.

---

## Production Build

```bash
cd frontend
npm run build
```

Outputs a static bundle to `frontend/dist/` which can be served by any static host (Nginx, Vercel, Netlify, etc.) or by Flask itself.

For the backend in production, use a real WSGI server instead of the Flask dev server:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## Project Structure

```
ecommerce-project/
├── database/
│   └── schema.sql              # MySQL schema + seed data
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── run.py                  # Entrypoint
│   └── app/
│       ├── config.py
│       ├── extensions.py
│       ├── models/             # SQLAlchemy models (7 tables)
│       ├── routes/             # Blueprints (auth, products, cart, orders, admin, etc.)
│       ├── utils/               # Validators, decorators, helpers
│       └── uploads/products/   # Uploaded product images
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   ├── api/                # Axios API modules
    │   ├── context/            # AuthContext, CartContext
    │   ├── components/         # Reusable UI (common, product, cart, admin)
    │   └── pages/              # Route-level pages (storefront + admin)
```

---

## API Overview

All endpoints are prefixed with `/api`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Products | `GET /products`, `GET /products/:id`, `POST/PUT/DELETE /products/:id` (admin) |
| Categories | `GET /categories`, `POST/PUT/DELETE /categories/:id` (admin) |
| Cart | `GET/POST /cart`, `PUT/DELETE /cart/:id`, `DELETE /cart/clear` |
| Wishlist | `GET/POST /wishlist`, `DELETE /wishlist/:id` |
| Orders | `POST /orders/checkout`, `GET /orders`, `PUT /orders/:id/cancel` |
| Admin Orders | `GET /orders/admin/all`, `PUT /orders/admin/:id/status` |
| Users | `GET/PUT /users/profile`, `PUT /users/change-password` |
| Admin | `GET /admin/dashboard`, `GET /admin/users`, `PUT /admin/users/:id/toggle-status` |

All admin routes require a JWT with `role: admin` in its claims (enforced server-side via the `@admin_required()` decorator).

---

## Notes

- Product images are uploaded to `backend/app/uploads/products/` and served at `/uploads/products/<filename>`.
- Checkout is **Cash on Delivery (COD)** style — no payment gateway is integrated. Orders are created directly, stock is decremented, and the cart is cleared.
- JWT tokens are stored in `localStorage` on the frontend and attached automatically via an Axios interceptor.
