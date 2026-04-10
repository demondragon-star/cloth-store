# 👕 Cloth Store — Full-Stack Fashion E-Commerce Platform

A full-stack clothing store platform built as a monorepo with a customer mobile app, admin mobile app, admin web dashboard, and an AI-powered product background removal service.

---

## ✨ Features

- 🖼️ AI-powered automatic product image background removal
- 🛍️ Browse, search, and purchase clothing products
- 🔐 Secure user authentication and profile management
- 🛒 Cart management and order placement
- 📦 Admin product management — add, edit, delete listings
- 📋 Order management and status tracking
- 👥 Customer management and activity view
- 📊 Admin dashboard with sales and inventory insights
- 📱 Cross-platform mobile apps (iOS & Android)
- 🌐 Admin web dashboard for full store control

---

## 📖 Overview

**Cloth Store** is a monorepo containing four modules:

| Module | Description |
|---|---|
| `customer-app` | Mobile app for customers to browse and shop |
| `admin-app` | Mobile app for admins to manage the store on the go |
| `admin-web` | Web dashboard for full store administration |
| `product-bg-removal` | Python microservice for AI background removal on product images |

**Tech Stack:** TypeScript, React Native (Expo), Next.js, Python, PostgreSQL

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) v3.9+
- [Expo Go](https://expo.dev/go) app on your phone (for mobile apps)

### Installation

```bash
# Clone the repo
git clone https://github.com/krishnateja7781/cloth-store.git
cd cloth-store

# Install root dependencies
npm install

# Install each app's dependencies
cd admin-web && npm install && cd ..
cd customer-app && npm install && cd ..
cd admin-app && npm install && cd ..
cd product-bg-removal && pip install -r requirements.txt && cd ..
```

---

## ▶️ Running the Apps

### 📱 Customer App (Mobile)

```bash
cd customer-app
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.

### 📱 Admin App (Mobile)

```bash
cd admin-app
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.

> **Sharing over the internet?** Use `npx expo start --tunnel` to get a public QR link that works outside your local Wi-Fi.

### 🖥️ Admin Web Dashboard

```bash
# Starts admin web + background removal API together
npm run dev

# Or run web only
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying for Demo / Preview

| App | Tool | Steps |
|---|---|---|
| **Admin Web** | [Vercel](https://vercel.com) | Import repo → set root dir to `admin-web` → Deploy |
| **Customer App** | Expo Go | Run `npx expo start --tunnel` → Share QR link |
| **Admin App** | Expo Go | Run `npx expo start --tunnel` → Share QR link |

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Admin web + background removal API (together) |
| `npm run dev:web` | Admin web dashboard only |
| `npm run dev:api` | Background removal API only |
| `npm run start` | Production mode |

---

ADMIN WEB PANEL :

<img width="1600" height="693" alt="image" src="https://github.com/user-attachments/assets/53b7a7eb-2bb0-4cd0-a4f4-2e14270c901c" />

ADMIN APP :

<img width="1080" height="2303" alt="image" src="https://github.com/user-attachments/assets/7b9ca368-aba9-47a7-900c-06630fbe2cb9" />

CUSTOMER APP :

<img width="1080" height="2308" alt="image" src="https://github.com/user-attachments/assets/c57bb0de-d3a1-4ac1-abde-48c9f54883c6" />

>    Built with ❤️ by [Krishna Teja](https://github.com/krishnateja7781)
