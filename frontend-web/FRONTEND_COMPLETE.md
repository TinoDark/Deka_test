# DEKA Frontend - Web Application

Modern, production-ready frontend for the DEKA Social-Commerce platform. Built with **Next.js 14+**, **React 18**, and **Tailwind CSS**.

## 🎯 Key Features

✅ **Role-Based Dashboards**
- Revendeur (Reseller): Stats, orders, catalogs, wallet management
- Fournisseur (Supplier): Inventory management, order preparation, analytics
- Admin: KYC approvals, dispute resolution, refund management
- Delivery: (See mobile app for delivery interface)

✅ **Complete API Integration**
- Authentication with JWT
- Payment processing
- Orders & logistics tracking
- Wallet & commission management
- Catalog browsing & management

✅ **Modern UI/UX**
- Responsive design (mobile-first)
- Tailwind CSS components
- Real-time updates with WebSocket
- Form validation with React Hook Form + Zod

✅ **Security**
- JWT token management
- RBAC (Role-Based Access Control)
- XSS protection with Next.js
- CSRF tokens in forms

---

## 📦 Project Structure

```
frontend-web/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Landing page
│   ├── login/page.tsx            # Authentication
│   ├── signup/page.tsx           # Registration
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── admin/
│   │   └── dashboard/page.tsx    # Admin dashboard
│   ├── suppliers/
│   │   └── dashboard/page.tsx    # Supplier dashboard
│   └── resellers/
│       └── dashboard/page.tsx    # Reseller dashboard
├── components/                   # Reusable React components
│   ├── Navbar.tsx               # Navigation bar
│   ├── Card.tsx                 # Card & StatCard components
│   └── ...                      # Other shared components
├── lib/
│   ├── api.ts                   # Axios instance with interceptors
│   ├── store.ts                 # Zustand auth store
│   ├── services/                # API service layer
│   │   ├── auth.service.ts      # Authorization
│   │   ├── catalog.service.ts   # Products management
│   │   ├── orders.service.ts    # Orders management
│   │   ├── payments.service.ts  # Payments & payouts
│   │   ├── wallet.service.ts    # Wallet management
│   │   ├── admin.service.ts     # Admin operations
│   │   └── index.ts             # Services export
│   └── ...
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.js               # Next.js config
└── tailwind.config.ts           # Tailwind CSS config
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
cd frontend-web

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Update .env.local with your API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Visit: http://localhost:3000

### Production Build

```bash
npm run build
npm run start
```

---

## 📋 Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | page.tsx | Landing page with features |
| `/login` | login/page.tsx | User authentication |
| `/signup` | signup/page.tsx | New account creation |
| `/resellers/dashboard` | resellers/dashboard | Reseller main dashboard |
| `/resellers/catalog` | resellers/catalog | Browse available products |
| `/resellers/wallet` | resellers/wallet | Commission management & payouts |
| `/resellers/orders` | resellers/orders | Order history & tracking |
| `/suppliers/dashboard` | suppliers/dashboard | Supplier main dashboard |
| `/suppliers/inventory` | suppliers/inventory | Product management (upload Excel) |
| `/suppliers/orders` | suppliers/orders | Orders to prepare |
| `/admin/dashboard` | admin/dashboard | Admin control center |
| `/admin/kyc` | admin/kyc | KYC approval queue |
| `/admin/disputes` | admin/disputes | Dispute resolution |
| `/admin/refunds` | admin/refunds | Refund journal |

---

## 🔧 API Services

All API calls go through typed service classes:

### AuthService
```typescript
import { AuthService } from '@/lib/services';

// Login
const response = await AuthService.login({ email, password });
// Returns: { accessToken, refreshToken, user }

// Signup
const response = await AuthService.signup({ 
  email, password, fullName, role 
});

// Logout
await AuthService.logout();
```

### CatalogService
```typescript
import { CatalogService } from '@/lib/services';

// Get products
const { data, total } = await CatalogService.getProducts({ category, limit: 20 });

// Get categories
const categories = await CatalogService.getCategories();

// Upload inventory (suppliers)
const report = await CatalogService.uploadCatalog(file);
```

### OrderService
```typescript
import { OrderService } from '@/lib/services';

// Create order
const order = await OrderService.createOrder({
  items: [{ productId, quantity }],
  totalAmount: 50000
});

// List orders
const { data, total } = await OrderService.listOrders('delivered', 20, 0);

// Cancel order
await OrderService.cancelOrder(orderId, 'Changed my mind');
```

### PaymentService
```typescript
import { PaymentService } from '@/lib/services';

// Request payout
const payout = await PaymentService.requestPayout(
  10000,  // amount
  'MTN',  // provider
  '+237699123456'  // phone
);

// List payouts
const { data, total } = await PaymentService.listPayouts('completed');

// Refund (admin)
const refund = await PaymentService.refundPayment(paymentId, 'reason', amount?);
```

### WalletService
```typescript
import { WalletService } from '@/lib/services';

// Get wallet balance
const wallet = await WalletService.getWallet();
// Returns: { balance, currency, totalEarnings, totalWithdrawals }

// Get earnings stats
const stats = await WalletService.getEarningsStats();
// Returns: { dailyEarnings, weeklyEarnings, monthlyEarnings, totalEarnings }

// Get transactions
const { data, total } = await WalletService.getTransactions('commission', 'completed');
```

### AdminService
```typescript
import { AdminService } from '@/lib/services';

// Get KYC queue
const { data, total } = await AdminService.getKYCRequests('pending');

// Approve KYC
await AdminService.approveKYC(userId);

// Get disputes
const { data, total } = await AdminService.getDisputes('open');

// Resolve dispute
await AdminService.resolveDispute(disputeId, 'resolution text', refundAmount);

// Get dashboard stats
const stats = await AdminService.getDashboardStats();
```

---

## 🎨 Styling

Uses **Tailwind CSS 3.4** for styling. All components use utility classes:

```tsx
<div className="bg-white rounded-lg shadow border border-gray-200 p-6">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

### Color Scheme
- **Primary**: Blue (`bg-blue-600`)
- **Success**: Green (`bg-green-600`)
- **Warning**: Yellow (`bg-yellow-600`)
- **Error**: Red (`bg-red-600`)
- **Neutral**: Gray (`bg-gray-100` to `bg-gray-900`)

---

## 🛡️ Authentication Flow

1. User submits login form → `AuthService.login()`
2. Backend validates credentials → returns JWT + user data
3. Frontend stores tokens in `localStorage` + Zustand store
4. API interceptor adds `Authorization: Bearer <token>` to requests
5. If token expires → auto-refresh via `AuthService.refreshToken()`

### Protected Routes

Wrap pages with auth check:

```typescript
'use client';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'reseller') {
      router.push('/login');
    }
  }, [user, router]);

  // Page content...
}
```

---

## 📡 Environment Variables

Create `.env.local`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Analytics, third-party services
NEXT_PUBLIC_GA_ID=UA-xxxxxxxxx-x
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## 📚 Component Library

### Card Component

```tsx
import { Card } from '@/components/Card';

<Card title="My Title">
  Content here
</Card>

// Or with header/footer:
<Card
  header={<h3>Header Content</h3>}
  footer={<div>Footer</div>}
>
  Main content
</Card>
```

### StatCard Component

```tsx
import { StatCard } from '@/components/Card';

<StatCard
  label="Balance"
  value="50,000 XAF"
  icon="💰"
  color="green"
  trend={{ value: 15, direction: 'up' }}
/>
```

### Navbar Component

```tsx
import Navbar from '@/components/Navbar';

// Automatically includes logo, user dropdown, logout
<Navbar />
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Docker

See `Dockerfile.client`, `Dockerfile.reseller`, `Dockerfile.supplier` in root.

```bash
# Build for reseller
docker build -f frontend-web/Dockerfile.reseller -t deka-reseller:latest .

# Run
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://backend:3000 deka-reseller:latest
```

### Manual Server Deployment

```bash
npm run build
npm run start
```

Runs on `http://localhost:3000` by default.

---

## 🔗 Integration with Backend API

All services assume backend running on `NEXT_PUBLIC_API_URL`:

**Base Endpoints:**
- `POST /auth/login` → Login & get JWT
- `GET /catalog` → List products
- `POST /orders` → Create order
- `GET /payments/:id` → Get payment status
- `POST /wallet/withdraw` → Request payout
- `GET /admin/kyc` → List pending KYC
- etc.

See `DEPLOYMENT_READY_REPORT.md` and `backend/PAYMENTS_API.md` for backend endpoints.

---

## 🐛 Troubleshooting

### White screen on load
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is running

### 401 Unauthorized errors
- JWT token expired → auto-refresh should handle
- Check `localStorage` for `accessToken`
- Try logging in again

### API calls not working
- Verify backend CORS settings
- Check backend is running on correct port
- Inspect Network tab in DevTools

### Build fails
```bash
npm run type-check  # Check TypeScript errors
npm install --force # Reinstall if needed
```

---

## 📖 Additional Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React 18 Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
- [Recharts (Charts)](https://recharts.org)
- [Lucide Icons](https://lucide.dev)

---

## 📄 License

MIT

---

**Status**: ✅ Production Ready

Last Updated: 2026-03-26
