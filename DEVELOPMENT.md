# Dekora Development Guide

## 🎯 Phase 1 : Cœur Transactionnel (À faire)

### Tasks

- [ ] **Auth Module (Complété partiellement)**
  - [x] JWT strategy (Passport.js setup)
  - [x] Login endpoint
  - [x] Register endpoint
  - [ ] Refresh token flow
  - [ ] Email verification

- [ ] **Database & Prisma**
  - [ ] Run migrations: `npx prisma migrate dev`
  - [ ] Generate Prisma client: `npx prisma generate`
  - [ ] Add indexes for performance
  - [ ] Add audit logging

- [ ] **Payment Service**
  - [ ] Mobile Money webhook (idempotent)
  - [ ] Escrow management (locked funds)
  - [ ] Transaction ACID guarantees
  - [ ] Refund logic
  - [ ] Payment retry mechanism

- [ ] **Order Management**
  - [ ] Create order with items
  - [ ] Calculate routing (Direct vs Hub)
  - [ ] Generate package codes (AAMMJJ-XXXX)
  - [ ] Order status transitions
  - [ ] Commission calculation

### Key Implementation Points

#### 1. Idempotent Payment Callback
```typescript
// Problem: Mobile Money might retry webhook
// Solution: idempotency_key in database

POST /payments/callback {
  idempotencyKey: "unique-key-from-provider",
  orderId: "uuid",
  amount: 1000,
  status: "COMPLETED",
  transactionId: "MTN-TXN-123"
}

// Database stores (orderId, idempotencyKey)
// If same key arrives again → return existing payment
```

#### 2. Escrow & ACID Transactions
```typescript
// Escrow = funds locked in database until delivery confirmed
// Both order creation AND escrow update must be atomic

await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({
    data: { ... }
  });

  // Lock funds in escrow
  await tx.order.update({
    where: { id: order.id },
    data: { escrowBalance: totalAmount }
  });

  // Update wallet
  await tx.user.update({
    where: { id: resellerId },
    data: {
      walletBalance: {
        decrement: totalAmount
      }
    }
  });

  return order;
});
```

#### 3. Package Code Generation
```typescript
// Format: AAMMJJ-XXXX
// AA = Year (25)
// MM = Month (03)
// JJ = Day (26)
// XXXX = Random 4 chars (A-Z, 0-9)

function generatePackageCode(): string {
  const now = new Date();
  const date = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${date}-${code}`;
}
```

---

## 🚚 Phase 2 : Logistique (À faire)

- [ ] **Routing Algorithm**
  - [ ] 1 fournisseur → DIRECT
  - [ ] >1 fournisseur → HUB (grouping)
  - [ ] Zone coverage mapping

- [ ] **Package Status PATCH**
  - [ ] Offline SQLite sync
  - [ ] Conflict resolution
  - [ ] WebSocket real-time updates
  - [ ] Location tracking (GPS)

- [ ] **Delivery Agent Management**
  - [ ] Accept/reject delivery
  - [ ] Map assignments
  - [ ] Rating system

---

## 🎨 Phase 3 : Interfaces (À faire)

### Client Shop
- [ ] Product catalog
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Order tracking

### Reseller Dashboard
- [ ] Sales metrics
- [ ] Product curation
- [ ] Wallet / Cash out
- [ ] Shop customization

### Supplier Dashboard
- [ ] Inventory management
- [ ] Order preparation
- [ ] Sales history

### Mobile App (Livreur)
- [ ] Task list
- [ ] Code scanner
- [ ] GPS mapping
- [ ] Offline sync

---

## ⚙️ Phase 4 : Admin & Finitions (À faire)

- [ ] **KYC Validation**
  - [ ] Document verification
  - [ ] Approval queue
  - [ ] Rejection workflow

- [ ] **Dispute Management**
  - [ ] Claim submission
  - [ ] Evidence collection
  - [ ] Resolution

- [ ] **Notifications**
  - [ ] SMS alerts
  - [ ] Push notifications
  - [ ] Email notifications

- [ ] **Performance**
  - [ ] CDN for images
  - [ ] Database query optimization
  - [ ] Caching strategy (Redis)

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test

# Test auth
npm test -- auth.service

# Test payments
npm test -- payments.service
```

### Integration Tests
```bash
npm run test:e2e

# Test order workflow
npm run test:e2e -- orders.e2e
```

### Load Testing
```bash
# Using Artillery
artillery quick --count 10 --num 100 http://localhost:3000/catalog
```

---

## 🔍 Code Review Checklist

- [ ] Follows NestJS patterns
- [ ] DTOs & validation
- [ ] Error handling
- [ ] Database transactions (where needed)
- [ ] RBAC checks
- [ ] Logging
- [ ] Unit tests (>80% coverage)
- [ ] Documentation

---

## 📦 Adding New Features

### 1. Create Entity
```typescript
// In prisma/schema.prisma
model MyEntity {
  id String @id @default(uuid())
  name String
  userId String
  user User @relation(fields: [userId], references: [id])
}
```

### 2. Generate Migration
```bash
npx prisma migrate dev --name "add_my_entity"
```

### 3. Create Service
```typescript
// my-entity/my-entity.service.ts
@Injectable()
export class MyEntityService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMyEntityDto) {
    return this.prisma.myEntity.create({ data });
  }
}
```

### 4. Create Controller
```typescript
// my-entity/my-entity.controller.ts
@Controller('my-entities')
export class MyEntityController {
  constructor(private service: MyEntityService) {}

  @Post()
  create(@Body() dto: CreateMyEntityDto) {
    return this.service.create(dto);
  }
}
```

### 5. Add Tests
```typescript
// my-entity/my-entity.service.spec.ts
describe('MyEntityService', () => {
  it('should create entity', async () => {
    const result = await service.create({ name: 'Test' });
    expect(result.name).toBe('Test');
  });
});
```

---

## 🐛 Debugging Tips

### Backend Debugging
```bash
# Run with inspector
node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/nest start

# In VS Code: Launch "Attach to NestJS"
```

### Database Debugging
```bash
# Open Prisma Studio
npx prisma studio

# Query logs
DATABASE_QUERY_LOG=true npm run start:dev
```

### Frontend Debugging
```bash
# React DevTools
npm install -D @react-devtools/shell

# Next.js debug mode
NODE_OPTIONS='--inspect-brk' npm run dev
```

---

## 📚 Resources

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [React Native Docs](https://reactnative.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)

---

## 🚀 Deploy Feature Branch

```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Push and create PR
git push origin feature/my-new-feature

# Automated tests will run
# After approval, merge to main
# → Auto-deploy to staging
# → Manual promotion to production
```

---

**Last updated: 2025-03-26**
