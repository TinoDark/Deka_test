# 🚀 Dekora - GitHub Push & Deployment Guide

**Complete step-by-step instructions for pushing to GitHub and deploying to production.**

---

## 📋 Pre-Deployment Checklist

- [ ] Backend `.env` file created with database credentials
- [ ] Frontend `.env.local` created with API URL
- [ ] Both `npm install` commands completed
- [ ] Backend compiles without errors (`tsc --noEmit`)
- [ ] GitHub repository created
- [ ] GitHub credentials configured locally

---

## 🔑 Step 1: Prepare GitHub

### Create Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `dekora` (or your preference)
3. Description: `Social-Commerce as a Service Platform`
4. Choose: **Private** (for development) or **Public** (for open-source)
5. **Create repository**

### Configure Git Locally

```bash
# Navigate to project root
cd c:\Users\USER\Deka_test

# Initialize git if needed
git init

# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/dekora.git

# Verify
git remote -v
```

---

## 📤 Step 2: Commit & Push to GitHub

### Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
*.lock

# Environment
.env
.env.local
.env*.local

# Build
dist/
build/
.next/
.venv/

# IDE
.vscode/
.idea/
*.swp
*.sublime-project

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.jest-cache

# Prisma
prisma/generated/

# SQLite (mobile offline DB)
*.sqlite
*.sqlite3
EOF
```

### Stage All Files

```bash
git add .
```

### Create Initial Commit

```bash
git commit -m "feat: Initial Dekora platform - Backend + Frontend

✅ COMPLETE: Backend (NestJS 10.3)
   - Payments API with idempotent callbacks
   - Auth with JWT + RBAC (4 roles)
   - Catalog, Orders, Wallet, Admin modules
   - PostgreSQL database with Prisma
   - 0 TypeScript compilation errors
   - Complete API documentation

✅ COMPLETE: Frontend (Next.js 14)
   - 6 React dashboards (Reseller, Supplier, Admin)
   - 6 typed API services
   - Authentication flow with role-based routing
   - Responsive Tailwind CSS design
   - Full form validation with Zod

✅ COMPLETE: Documentation
   - CLAUDE.md (Architecture)
   - DEPLOYMENT_READY_REPORT.md (Checklist)
   - FRONTEND_COMPLETE.md (Frontend guide)
   - PROJECT_DEPLOYMENT_COMPLETE.md (Summary)

🚀 READY FOR DEPLOYMENT"
```

### Push to GitHub

```bash
# First push (set upstream)
git branch -M main
git push -u origin main

# Subsequent pushes
git push origin main
```

### Verify on GitHub

1. Go to your repository on GitHub
2. Verify all files are there
3. Check the commit history

---

## 🏗️ Step 3: Deploy Backend

### Option A: Railway (Easiest - Recommended)

1. **Sign Up**
   - Go to [railway.app](https://railway.app)
   - Click "Start Project"
   - Sign in with GitHub

2. **Create New Project**
   - Click "Create New Project"
   - Select "Deploy from GitHub"
   - Authenticate GitHub

3. **Connect Repository**
   - Select your `dekora` repository
   - Railway will auto-detect Node.js

4. **Configure Environment**
   - Go to "Variables" tab
   - Add these variables:

   ```
   DATABASE_URL=postgresql://user:password@host:5432/dekora_db
   JWT_SECRET=<generate-32-char-random>
   PAYMENT_WEBHOOK_SECRET=<generate-32-char-random>
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 min)
   - Note the public URL (e.g., `https://dekora-backend.railway.app`)

### Option B: Docker (Advanced)

1. **Add Dockerfile** to `backend/`

   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci

   COPY . .

   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "run", "start:prod"]
   ```

2. **Build Image**
   ```bash
   docker build -f backend/Dockerfile -t dekora-backend:latest .
   ```

3. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:pass@host:5432/dekora_db" \
     -e JWT_SECRET="your-secret" \
     dekora-backend:latest
   ```

### Option C: AWS/GCP/Azure

1. Create VM or App Engine instance
2. Clone repository
3. Run `backend/setup.sh`
4. Start with `npm run start:prod`

---

##  🌐 Step 4: Deploy Frontend

### Option A: Vercel (Easiest - Recommended)

1. **Sign Up**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New"
   - Select "Project"
   - Select your `dekora` repository

3. **Configure**
   - **Root Directory**: `frontend-web`
   - Build Command: `npm run build` (default is fine)

4. **Add Environment Variables**
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://dekora-backend.railway.app` (from Railway step)

5. **Deploy**
   - Click "Deploy"
   - Wait for build (~1-2 min)
   - Get public URL (e.g., `https://dekora.vercel.app`)

### Option B: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add New Site"
3. Select "Import an existing project"
4. Connect GitHub
5. Set build config:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: `frontend-web`
6. Add environment variable `NEXT_PUBLIC_API_URL`
7. Deploy

### Option C: Manual Server

```bash
# Connect to your server
ssh user@your-server.com

# Clone repo
git clone https://github.com/YOUR_USERNAME/dekora.git
cd dekora/frontend-web

# Install & build
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "dekora-frontend" -- run start
pm2 save
pm2 startup
```

---

## 🗄️ Step 5: Setup Database

### PostgreSQL Setup

1. **Create Database**
   ```sql
   createdb dekora_db
   ```

2. **Create User**
   ```sql
   createuser dekora_user
   psql -c "ALTER USER dekora_user PASSWORD 'your_strong_password';"
   psql -c "ALTER USER dekora_user CREATEDB;"
   ```

3. **Grant Privileges**
   ```sql
   psql -d dekora_db -c "GRANT ALL PRIVILEGES ON DATABASE dekora_db TO dekora_user;"
   ```

4. **Update .env**
   ```
   DATABASE_URL="postgresql://dekora_user:your_strong_password@localhost:5432/dekora_db"
   ```

### Run Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed database
npx prisma db seed
```

---

## ✅ Step 6: Verify Deployment

### Test Backend API

```bash
# Should return 200 with error message (no auth)
curl https://dekora-backend.railway.app/payments

# Should return 401 (expected - no token)
# Output: { "message": "Unauthorized", "statusCode": 401 }
```

### Test Authentication

```bash
# Get signup page
curl https://dekora.vercel.app/signup

# Should see HTML with sign-up form
```

### Monitor

- **Railway**: Dashboard shows logs and CPU usage
- **Vercel**: Deployments tab shows logs
- **Terminal**: `tail -f /var/log/app.log`

---

## 🔨 Step 7: Post-Deployment Configuration

### Update Frontend API URL

If you didn't use Vercel:

1. Update `frontend-web/.env.local`
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

2. Rebuild frontend
   ```bash
   npm run build
   npm run start
   ```

### Configure Email (Optional)

In `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Setup Mobile Money Webhooks

For MTN, Moov Money:
- Register your URLs in their dashboards:
  - `https://dekora-backend.railway.app/payments/callback`
  - `https://dekora-backend.railway.app/payments/payouts/webhook`
- Get API keys and add to backend `.env`

---

## 📊 Step 8: Monitoring & Maintenance

### Set Up Alerts

```bash
# Backend (Railway)
1. Go to Railway project
2. Settings → Alerts
3. Add: CPU > 80%, Memory > 85%, Error Rate > 1%

# Frontend (Vercel)
1. Go to Vercel project
2. Settings → Notifications
3. Enable: Deployment, Error Alerts
```

### View Logs

```bash
# Railway backend
railway logs

# Vercel frontend
vercel logs

# Local server
tail -f /var/log/dekora/*.log
```

### Database Backups

```bash
# Daily backup
0 2 * * * pg_dump dekora_db | gzip > /backups/dekora_$(date +\%Y\%m\%d).sql.gz
```

---

## 🔐 Security Checklist

- [ ] Generate strong `JWT_SECRET` (32+ chars, random)
- [ ] Generate strong `PAYMENT_WEBHOOK_SECRET`
- [ ] Database password is strong (20+ chars)
- [ ] `.env` files NOT in git (check `.gitignore`)
- [ ] HTTPS enabled on both backend & frontend
- [ ] CORS configured to trusted domains only
- [ ] Rate limiting enabled (coming)
- [ ] Secrets stored in deployment platform (not in git)
- [ ] Database backups configured
- [ ] Monitoring & alerts set up

---

## 📱 Testing the Platform

### Sign Up & Login

1. Go to `https://dekora.vercel.app`
2. Click "Get Started"
3. Choose "Reseller"
4. Fill form & sign up
5. Should redirect to `/resellers/dashboard`

### Test Reseller Flows

- ✅ Browse catalog
- ✅ View wallet balance
- ✅ Check order history
- ✅ Request payout (test)

### Test Supplier Flows

- Repeat signup as "Supplier"
- ✅ Upload inventory (Excel)
- ✅ View pending orders
- ✅ Confirm preparation

### Test Admin Flows

- Use deployment credentials
- Login with admin account
- ✅ View KYC queue
- ✅ View disputes
- ✅ View analytics

---

##  🎓 Next Steps

### Phase 2: Enhancement
- [ ] Mobile delivery app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics & reports
- [ ] Multi-language support
- [ ] Payment provider integrations

### Phase 3: Growth
- [ ] Referral program
- [ ] Affiliate tracking
- [ ] Advanced logistics routing
- [ ] AI product recommendations
- [ ] Social media integrations

---

## 🆘 Troubleshooting

### Build Fails on Railway

```
Error: Cannot find module '@nestjs/common'
→ Railway cache cleared, let's rebuild
→ Solution: Railway → Settings → Clear Deploy Cache
```

### Frontend shows "Backend Error"

```
Error: CORS or connection refused
→ Solution: Update NEXT_PUBLIC_API_URL in Vercel dashboard
→ Wait 2-3 min for redeployment
```

### Database connection error

```
Error: Connection refused on localhost:5432
→ Solution: Update DATABASE_URL to remote database
→ Check credentials match PostgreSQL user
```

### JWT token invalid

```
Error: 401 Unauthorized
→ Solution: Frontend token expires
→ Auto-refresh should work
→ If not: Check JWT_SECRET matches backend
```

---

## 📞 Support URLs

After deployment:

| Resource | Link |
|----------|------|
| **Frontend** | `https://dekora.vercel.app` |
| **Backend API** | `https://dekora-backend.railway.app` |
| **API Docs** | `https://dekora-backend.railway.app/api` |
| **GitHub** | `https://github.com/YOUR_USERNAME/dekora` |
| **Documentation** | See `CLAUDE.md` and `*.md` files |

---

## ✨ Deployment Complete!

🎉 Your Dekora platform is now live!

**Next**: Share with users and start onboarding.

---

**Generated**: 2026-03-26  
**Status**: ✅ Ready to Deploy  
**Estimated Time**: 30 minutes
