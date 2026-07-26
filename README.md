# ArtVault

## Full-Stack Digital Art Marketplace and Virtual Exhibition Platform

ArtVault is a production-ready full-stack web application that enables artists to showcase and sell original artwork, collectors to discover and purchase art, and curators to create immersive virtual exhibitions. The platform combines a modern React frontend with a Flask REST API backend, MySQL database, secure JWT authentication, and role-based access control.

**Live Demo**

Frontend: https://artvault-ashen.vercel.app

Backend API: https://artvault-production-d5e8.up.railway.app

Repository: https://github.com/Sreevarshini-140/Artvault

---

# Project Overview

ArtVault is designed as a modern online art marketplace that supports multiple user roles while providing an intuitive experience for browsing, purchasing, reviewing, and managing artwork.

The project demonstrates production-level full-stack development using modern web technologies, secure authentication, RESTful APIs, responsive user interfaces, cloud deployment, and relational database design.

---

# Features

## Public Users

- Browse artwork collection
- Search artworks
- Filter and sort artworks
- View artwork details
- Explore artists
- Browse exhibitions
- Browse shop products
- Register account
- Login securely

---

## Collectors

- Wishlist management
- Follow artists
- Shopping cart
- Purchase artworks
- View order history
- Submit artwork reviews
- Manage profile
- View notifications

---

## Artists

- Artist dashboard
- Upload artworks
- Manage portfolio
- Edit artwork details
- Delete artworks
- Track portfolio performance
- View followers
- Manage profile

---

## Curators

- Curator dashboard
- Exhibition builder
- Create exhibitions
- Select artworks
- Upload exhibition banner
- Schedule exhibitions

---

## Administrators

- User management
- Reports dashboard
- Platform monitoring
- Content moderation
- Administrative APIs

---

# Technology Stack

## Frontend

- React
- Vite
- React Router
- Axios
- Lucide React
- CSS

---

## Backend

- Python
- Flask
- Flask-JWT-Extended
- SQLAlchemy
- Werkzeug
- Gunicorn

---

## Database

- MySQL

---

## Deployment

Frontend

- Vercel

Backend

- Railway

Database

- Railway MySQL

---

# Architecture

```
                 React + Vite
                      │
                      │ REST API
                      ▼
              Flask REST Backend
                      │
        JWT Authentication
                      │
                      ▼
              Railway MySQL Database
```

---

# Application Modules

## Public Pages

- Home
- Explore
- Artwork Details
- Artists
- Artist Profile
- Exhibitions
- Exhibition Details
- Shop
- Login
- Register

---

## User Features

- Dashboard
- Wishlist
- Following
- Orders
- Notifications
- Profile
- Cart

---

## Artist Features

- Upload Artwork
- My Artworks
- Artist Dashboard

---

## Curator Features

- Curator Studio
- Exhibition Builder

---

## Admin Features

- User Management
- Reports

---

# Folder Structure

```
ArtVault
│
├── backend
│   ├── app
│   │   ├── models
│   │   ├── routes
│   │   ├── utils
│   │   ├── static
│   │   └── uploads
│   │
│   ├── migrations
│   ├── requirements.txt
│   ├── run.py
│   └── config.py
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── services
│   │   ├── styles
│   │   └── utils
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs
│
├── database.sql
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/Sreevarshini-140/Artvault.git

cd Artvault
```

---

# Backend Setup

```bash
cd backend

python -m venv venv
```

Windows

```bash
venv\Scripts\activate
```

Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Create environment file

```bash
copy .env.example .env
```

Configure

- Database URL
- JWT Secret
- Secret Key
- Frontend URL

Run

```bash
python seed.py

python run.py
```

Backend runs at

```
http://127.0.0.1:5000
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# Production Deployment

Frontend

- Vercel

Backend

- Railway

Database

- Railway MySQL

The application is fully deployed and accessible through the live demo.

---

# Authentication

ArtVault uses

- JWT Authentication
- Password Hashing
- Protected Routes
- Role-Based Authorization

Supported Roles

- Visitor
- Collector
- Artist
- Curator
- Administrator

---

# Database

Main entities include

- Users
- Artists
- Artworks
- Categories
- Orders
- Order Items
- Reviews
- Wishlist
- Following
- Exhibitions
- Notifications

---

# Security Features

- Password hashing
- JWT authentication
- Protected API endpoints
- Role-based authorization
- Secure file uploads
- Environment variables
- CORS configuration
- Input validation

---

# Future Enhancements

- Payment Gateway Integration
- Email Verification
- Password Reset
- Artwork Recommendations
- AI Artwork Search
- Live Notifications
- Cloud Image Storage
- Analytics Dashboard
- Auction System
- Mobile Application

---

# Screenshots

Screenshots of the application can be found in the `docs/` directory.

Recommended screenshots:

- Home
- Explore
- Artwork Details
- Artists
- Dashboard
- Upload Artwork
- My Artworks
- Exhibitions
- Cart
- Orders

---

# Author

**Prasangi Sree Varshini**

B.Tech Computer Science and Engineering (Artificial Intelligence & Machine Learning)

Raghu Engineering College

LinkedIn

https://linkedin.com/in/sree-varshini-prasangi-a40641341/

GitHub

https://github.com/Sreevarshini-140

---

# License

This project was developed for educational and portfolio purposes.
