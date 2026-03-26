# Deka Backend API Documentation

## 🔌 Overview

Cette API expose l'ensemble des services pour la plateforme Social-Commerce :
- Authentification & Autorisation (JWT + RBAC)
- Gestion produits & catalogue  
- Gestion commandes & paiements
- Logistique & tracking
- Wallet & payouts
- Admin panel & KYC

Base URL: `http://localhost:3000`

---

## 🔐 Authentication

### Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@deka.com",
  "password": "password123"
}

Response 200 OK:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@deka.com",
    "role": "SUPPLIER",
    "kycStatus": "APPROVED"
  }
}
```

### Register

```
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@deka.com",
  "password": "secure123",
  "phone": "+212611111111",
  "role": "RESELLER"  // or SUPPLIER, DELIVERY
}

Response 201 Created:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}
```

### Token Pattern

```
Authorization: Bearer eyJhbGc...
```

---

## 📦 Products API

### Get All Products

```
GET /catalog?limit=20&skip=0&category=Electronics

Response 200 OK:
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "retailPrice": 599,
      "wholesalePrice": 400,
      "stock": 100,
      "isActive": true
    }
  ],
  "total": 543
}
```

### Create Product

```
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "AirPods Pro",
  "description": "Wireless earbuds",
  "retailPrice": 249,
  "wholesalePrice": 100,
  "stock": 200,
  "category": "Electronics",
  "sku": "AP-PRO-001"
}

Response 201 Created:
{
  "id": "uuid",
  "supplierId": "uuid",
  "name": "AirPods Pro",
  ...
}
```

### Update Product

```
PATCH /products/:id
Authorization: Bearer <token>

{
  "stock": 150,
  "isActive": true
}

Response 200 OK: { ... }
```

---

## 🛒 Orders API

### Create Order

```
POST /orders
Content-Type: application/json

{
  "resellerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "customerEmail": "customer@example.com",
  "customerPhone": "+212611111111",
  "deliveryAddress": "123 Main St, City"
}

Response 201 Created:
{
  "id": "order-uuid",
  "status": "PENDING",
  "totalAmount": 1198,
  "escrowBalance": 1198,
  "items": [ ... ]
}
```

### Get Order Details

```
GET /orders/:id
Authorization: Bearer <token>

Response 200 OK:
{
  "id": "order-uuid",
  "status": "DELIVERED",
  "items": [
    {
      "packageCode": "260325-A1B2",
      "status": "DELIVERED"
    }
  ],
  ...
}
```

---

## 💳 Payments API

### Payment Webhook (Mobile Money Callback)

```
POST /payments/callback
Content-Type: application/json
X-Signature: <sha256-signature>

{
  "idempotencyKey": "unique-key",
  "orderId": "order-uuid",
  "amount": 1198,
  "status": "COMPLETED",
  "provider": "MTN",
  "transactionId": "MTN-TXN-123456"
}

Response 201 Created:
{
  "id": "payment-uuid",
  "status": "COMPLETED",
  "orderId": "order-uuid"
}
```

---

## 🚚 Logistics API

### Update Package Status (Livreur)

```
PATCH /logistics/package/:code
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COLLECTED",
  "latitude": 33.5731,
  "longitude": -7.5898
}

Response 200 OK:
{
  "packageCode": "260325-A1B2",
  "status": "COLLECTED",
  "collectedAt": "2025-03-26T10:30:00Z"
}
```

### Get My Deliveries

```
GET /logistics/deliveries
Authorization: Bearer <token>

Response 200 OK:
{
  "data": [
    {
      "packageCode": "260325-A1B2",
      "status": "PENDING", 
      "customerName": "John",
      "deliveryAddress": "123 Main St"
    }
  ]
}
```

---

## 💰 Wallet API

### Get Balance

```
GET /wallet/balance
Authorization: Bearer <token>

Response 200 OK:
{
  "balance": 50000.00,
  "pendingPayouts": 5000.00
}
```

### Request Payout

```
POST /payouts/request
Authorization: Bearer <token>

{
  "amount": 10000,
  "mobileProvider": "MTN",
  "mobileNumber": "+212611111111"
}

Response 201 Created:
{
  "id": "payout-uuid",
  "status": "PENDING",
  "amount": 10000
}
```

---

## ⚙️ Admin API

### Validate KYC

```
PATCH /admin/kyc/:userId
Authorization: Bearer <admin-token>

{
  "status": "APPROVED"  // or REJECTED
}

Response 200 OK:
{
  "userId": "uuid",
  "kycStatus": "APPROVED"
}
```

### Create Manual Refund

```
POST /admin/refunds
Authorization: Bearer <admin-token>

{
  "userId": "uuid",
  "amount": 5000,
  "reason": "Product defect"
}

Response 201 Created:
{
  "id": "refund-uuid",
  "status": "PENDING"
}
```

---

## 📊 Response Format

### Success Response

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2025-03-26T10:30:00Z"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": ["Email is required"]
}
```

---

## 🔄 Pagination

```
GET /orders?limit=20&skip=0&sort=createdAt:desc

Response:
{
  "data": [ ... ],
  "total": 543,
  "limit": 20,
  "skip": 0
}
```

---

## 🔒 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## 📝 Rate Limiting

- **Limit**: 100 requêtes par 15 minutes
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## 🧪 Testing avec cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@deka.com","password":"password123"}'

# Get products
curl -X GET http://localhost:3000/catalog \
  -H "Authorization: Bearer <access-token>"

# Create order
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 📚 Resources

- [Postman Collection](./postman-collection.json)
- [OpenAPI Spec](./openapi.yaml)
- [Architecture Doc](../CLAUDE.md)
