# Annapurna-Smart-Canteen

<div align="center">

![Annapurna Smart Canteen](https://img.shields.io/badge/Annapurna-Smart%20Canteen-FF7A33?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSAxMyBRNSAxOSAxMiAxOSBRMTkgMTkgMTkgMTMiIGZpbGw9IndoaXRlIi8+PC9zdmc+)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack smart canteen ordering system built for college campuses.**  
Real-time menu, UPI prepaid payments, loyalty rewards, admin dashboard — all in one.

[Live Demo](https://annapurna-smart-canteen.netlify.app/menu) · [Request Feature and report bug (rajeshmali8900@gmail.com)

</div>

---

## 📸 Screenshots

| Menu Page | Cart Drawer | Payment Flow |
|-----------|-------------|--------------|
| Browse dishes by category with live search | Slide-in cart with quantity controls | UPI QR code + COD selection |

| Receipt | Admin Dashboard | Loyalty System |
|---------|-----------------|----------------|
| Downloadable PDF receipt with logo | Manage menu, orders, stock | Bronze → Silver → Gold tiers |

---

## ✨ Features

### 👨‍🎓 Student / Customer Side
- **Live Menu** — Browse 18+ dishes across Breakfast, Lunch, Snacks, Beverages, Desserts
- **Smart Search & Filters** — Instant category filtering and dish search
- **Sliding Cart Drawer** — Add, remove, and adjust quantities without leaving the menu
- **UPI Prepaid Payment** — Dynamic QR code auto-generated with exact bill amount; supports GPay, PhonePe, Paytm, BHIM
- **Cash on Delivery** — Pay with cash when order arrives
- **ETA Estimation** — Calculates real delivery time based on each dish's prep time
- **Loyalty Points System** — Earn 10 pts per ₹100 spent; unlock Bronze 🥉, Silver 🥈, Gold 🥇 tiers
- **Downloadable PDF Receipt** — Beautiful branded receipt with Annapurna logo, order details, and thank-you message
- **Order History** — Track all past and current orders

### 👨‍💼 Admin Side
- **Live Orders Dashboard** — Real-time view of all incoming orders with ETA badges
- **Menu Management** — Add, edit, delete dishes with image upload (ImgBB API)
- **Out-of-Stock Toggle** — Instantly disable/enable items for ordering
- **Prep Time Control** — Set prep time per dish for accurate ETA calculation
- **Payment Verification** — Review UPI payment screenshots and mark orders as paid
- **Revenue Tracking** — Live revenue stats from active orders
- **Order Status Updates** — Move orders from Pending → Preparing → Ready → Delivered

### 🔐 Authentication
- Firebase Authentication (Email/Password)
- Role-based access — Admin vs Student detected by email
- Protected routes — Auto-redirect to login if not authenticated

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6 |
| **Styling** | Pure CSS-in-JS (no Tailwind dependency), Playfair Display + DM Sans fonts |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase Firestore (NoSQL) |
| **Auth** | Firebase Authentication |
| **Image Upload** | ImgBB API |
| **QR Code** | `api.qrserver.com` (no npm package needed) |
| **PDF Receipt** | Browser-native print API (no jsPDF needed) |

---

## 🏗️ Project Structure

```
annapurna-smart-canteen/
│
├── client/                        # React Frontend
│   ├── public/
│   └── src/
│       ├── firebase.js            # Firebase config (auth only)
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── MenuPage.jsx       # Main ordering page
│       │   ├── OrdersPage.jsx     # Order history
│       │   └── AdminDashboard.jsx # Admin panel
│       └── App.js                 # Routes & auth guard
│
├── server/                        # Node.js Backend
│   ├── server.js                  # Express API
│   └── serviceAccountKey.json    # Firebase Admin SDK (gitignored)
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Firebase project with Firestore + Authentication enabled
- ImgBB account (free) for image uploads

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/annapurna-smart-canteen.git
cd annapurna-smart-canteen
```

### 2. Setup the Backend
```bash
cd server
npm install
```

Add your Firebase service account key as `serviceAccountKey.json` in the `/server` folder (download from Firebase Console → Project Settings → Service Accounts).

```bash
node server.js
# Server runs on http://localhost:5000
```

### 3. Setup the Frontend
```bash
cd client
npm install
```

Create `src/firebase.js`:
```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

In `MenuPage.jsx`, update your UPI ID:
```js
const CANTEEN_UPI_ID   = 'yourname@upi';       // ← your real UPI ID
const CANTEEN_UPI_NAME = 'Your Canteen Name';
```

```bash
npm start
# App runs on http://localhost:3000
```

### 4. Create Admin Account
Register normally, then use `admin@canteen.edu.in` as the email (or update the check in `App.js` to your preferred admin email).

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menu` | Fetch all menu items |
| `POST` | `/api/menu` | Add new dish |
| `PUT` | `/api/menu/:id` | Edit dish |
| `DELETE` | `/api/menu/:id` | Delete dish |
| `PUT` | `/api/menu/:id/stock` | Toggle in-stock status |
| `GET` | `/api/orders` | Fetch all orders |
| `POST` | `/api/orders` | Place new order |
| `PUT` | `/api/orders/:id/status` | Update order status |
| `GET` | `/api/loyalty/:userId` | Get user's loyalty points |
| `POST` | `/api/loyalty/:userId/add` | Add loyalty points |

---

## 💳 Payment Flow

### UPI Prepaid
```
Customer adds to cart
       ↓
Checkout → Enter delivery details
       ↓
Select "UPI / QR Pay"
       ↓
QR Code generated with exact amount (upi://pay?pa=...&am=351.00)
       ↓
Customer scans & pays via GPay / PhonePe / Paytm
       ↓
Order placed with status: pending_verification
       ↓
Admin verifies payment in UPI app → marks as Paid
       ↓
Kitchen starts preparing 🍳
```

### Cash on Delivery
```
Customer selects COD
       ↓
Order placed immediately
       ↓
Customer pays exact cash on delivery
```

---

## 🏆 Loyalty Points System

| Tier | Points Required | Badge |
|------|----------------|-------|
| Bronze | 0 – 199 pts | 🥉 |
| Silver | 200 – 499 pts | 🥈 |
| Gold | 500+ pts | 🥇 |

**Earning rate:** 10 points per ₹100 spent  
Points are stored in Firestore and updated via the backend API using `FieldValue.increment()` to prevent race conditions.

---

## 📄 Receipt System

After every order, a **fully branded PDF receipt** is generated in the browser (no external library needed) containing:
- Annapurna logo with orange glow effect
- Order ID, date, and time
- Delivery name and location
- Payment method badge (UPI / COD)
- Itemized order with quantities
- Total breakdown with free delivery
- Loyalty points earned
- Personalised thank-you message

Uses the browser's native **Print → Save as PDF** — works in Chrome, Firefox, Edge, Safari.

---

## 🌱 Firestore Schema

```
/menu/{itemId}
  name, price, category, imageUrl, description,
  prepTime (mins), inStock (bool), available (bool), createdAt

/orders/{orderId}
  userId, items[], total, status, deliveryName, deliveryLocation,
  eta, pointsEarned, paymentMethod, paymentStatus, timestamp

/users/{userId}
  loyaltyPoints (number), createdAt
```

---

## 🙏 Acknowledgements

- [Firebase](https://firebase.google.com/) — Auth & Firestore
- [QR Server API](https://goqr.me/api/) — Free QR code generation
- [ImgBB](https://imgbb.com/) — Free image hosting
- [Google Fonts](https://fonts.google.com/) — Playfair Display & DM Sans
- Inspired by real campus canteen pain points 😄

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for campus life  
**Annapurna Smart Canteen** — *Freshly prepared, made with love every day*

</div>
