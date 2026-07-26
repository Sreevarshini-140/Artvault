# ArtVault — Luxury Digital Art Museum & Marketplace

ArtVault is a full-stack portfolio project combining a virtual art museum, curated exhibitions, artist portfolios and an art-commerce workflow. It demonstrates React, Flask REST APIs, MySQL, JWT authentication, role-based authorization, search, pagination, wishlists, reviews, orders and dashboards.

## Stack
- Frontend: React + Vite + React Router + Axios + Lucide
- Backend: Python + Flask + SQLAlchemy + JWT
- Database: MySQL 8
- Deployment-ready: Gunicorn, environment variables, production build

## Roles
- Visitor/Collector: browse, search, wishlist, review, follow artists, order products
- Artist: visitor capabilities plus artwork portfolio management
- Curator: create exhibitions and organize collections
- Admin: platform statistics and unrestricted content management APIs

## Folder structure
```
artvault/
├── backend/
│   ├── app/models, routes, utils
│   ├── config.py
│   ├── run.py
│   ├── seed.py
│   └── requirements.txt
├── frontend/
│   ├── src/components, context, pages, services, styles
│   └── package.json
├── docs/API.md
└── database.sql
```

## 1. MySQL setup
Create a MySQL database with either method:
```bash
mysql -u root -p < database.sql
```
Or allow SQLAlchemy to create tables during seeding.

## 2. Backend setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
```
Edit `.env` with your MySQL password, then run:
```bash
python seed.py
python run.py
```
API runs at `http://localhost:5000/api`.

Demo accounts after seeding:
- Admin: `admin@artvault.com` / `Admin@123`
- Artist: `artist@artvault.com` / `Artist@123`
- Curator: `curator@artvault.com` / `Curator@123`

## 3. Frontend setup
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```
Open `http://localhost:5173`.

## Production
Backend:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```
Frontend:
```bash
npm run build
```
Deploy `frontend/dist` to a static host and the Flask API to Render, Railway, AWS or another WSGI host. Restrict CORS to the final frontend domain and use strong secrets.

## Security notes
Passwords are hashed using Werkzeug. APIs enforce JWT identity and role checks. For real payment production, connect Stripe/Razorpay on the server, validate webhooks, add rate limiting, email verification, object storage uploads, CSRF protection where cookies are used, audit logs and automated tests.

## Included deliverables
Complete frontend and backend source, MySQL schema, seed script, environment examples, README, REST API documentation and ZIP package.

## Application pages

### Public
- `/` Luxury landing page
- `/explore` Artwork catalogue with search and pagination
- `/artworks/:id` Artwork details
- `/artists` Artist directory
- `/exhibitions` Curated exhibitions
- `/shop` Art products marketplace
- `/cart` Shopping cart
- `/login` Sign in
- `/register` Account registration

### Authenticated users
- `/dashboard` Role-aware dashboard
- `/wishlist` Saved artworks
- `/orders` Orders and invoices
- `/notifications` Account notifications
- `/profile` Profile settings

### Artist
- `/artist/upload` Upload artwork
- `/artist/artworks` Portfolio management

### Curator
- `/curator/studio` Exhibition builder

### Administrator
- `/admin/users` User management
- `/admin/reports` Reports and moderation
