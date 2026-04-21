# Dekora Platform - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Docker & docker-compose
- Domain name & SSL certificate
- Database backup strategy
- Monitoring setup (Sentry, Grafana)

---

## 🐳 Docker Registry Setup

### Build All Images
```bash
docker-compose build --no-cache
```

### Push to Registry (DockerHub, ECR, etc.)
```bash
# ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [YOUR_ECR_URL]
docker tag dekora-backend:latest [YOUR_ECR_URL]/dekora-backend:latest
docker push [YOUR_ECR_URL]/dekora-backend:latest
```

---

## 🌐 Deployment Platforms

### Option 1: Railway (Recommended for MVP)

```bash
# Install Railway CLI
npm i -g railway

# Login
railway login

# Init project
railway init

# Add env variables
railway variables set DATABASE_URL=...
railway variables set JWT_SECRET=...

# Deploy
railway up
```

### Option 2: Render

```bash
# Connect GitHub repo in Render console
# Add environment variables
# Render auto-deploys on git push
```

### Option 3: AWS ECS + RDS

```bash
# 1. Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier dekora-prod \
  --db-instance-class db.t3.micro \
  --engine postgres

# 2. Push Docker image to ECR
# (see Docker Registry Setup above)

# 3. Create ECS task definition pointing to ECR

# 4. Deploy ECS service
```

### Option 4: VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into VPS
ssh root@your-vps-ip

# Setup Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/your-org/dekora.git
cd dekora

# Setup environment
cp .env.example .env
# Edit .env with production values

# Create .env from secrets manager
# Docker will use it

# Deploy
docker-compose -f docker-compose.yml up -d

# Setup reverse proxy (Nginx)
sudo apt install nginx
# Configure nginx as reverse proxy on port 80/443
```

---

## 🔒 SSL/TLS Certificate (Let's Encrypt)

```bash
# Using Certbot with Docker
docker run -it --rm -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone \
  -d yourdomain.com -d www.yourdomain.com

# Copy certificate to docker
docker cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx:/etc/nginx/certs/

# Renew annually
certbot renew --dry-run
```

---

## 📊 Production Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pwd@prod-db.rds.amazonaws.com:5432/dekora"

# Redis (managed service)
REDIS_URL="redis://prod-redis.cache.amazonaws.com:6379"

# JWT
JWT_SECRET="$RANDOM_LONG_SECURE_KEY" # Use secret manager
JWT_EXPIRATION=900

# API
NODE_ENV="production"
API_PORT=3000
API_URL="https://api.dekora.com"

# Frontend
FRONTEND_CLIENT_URL="https://shop.dekora.com"
FRONTEND_RESELLER_URL="https://reseller.dekora.com"
FRONTEND_SUPPLIER_URL="https://supplier.dekora.com"
FRONTEND_ADMIN_URL="https://admin.dekora.com"

# Storage (AWS S3)
AWS_REGION="us-east-1"
AWS_S3_BUCKET="dekora-prod"
AWS_ACCESS_KEY_ID="$AWS_KEY" # From secrets manager
AWS_SECRET_ACCESS_KEY="$AWS_SECRET" # From secrets manager

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/yyy"
LOG_LEVEL="info"

# Payment Gateway (use test keys initially)
MTN_API_KEY="$MIX_BY_YAS_PROD_KEY"
ORANGE_API_KEY="$ORANGE_PROD_KEY"
PAYMENT_WEBHOOK_SECRET="$WEBHOOK_SECRET"
```

---

## 🗄️ Database Backups

### Daily Automated Backups (PostgREST RDS)

```bash
# AWS RDS handles automated backups
# Configure from AWS Console:
# - Backup retention period: 30 days
# - Preferred backup window: 02:00-03:00 UTC

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier dekora-prod \
  --db-snapshot-identifier dekora-prod-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier dekora-restore \
  --db-snapshot-identifier dekora-prod-20250326
```

### Local PostgreSQL Backups

```bash
# Dump database
docker-compose exec postgres pg_dump -U dekora dekora_social_commerce > backup.sql

# Restore
docker-compose exec postgres psql -U dekora dekora_social_commerce < backup.sql

# Upload to S3
aws s3 cp backup.sql s3://dekora-backups/$(date +%Y%m%d).sql
```

---

## 📈 Monitoring & Logging

### Sentry Setup (Error Tracking)

```bash
# 1. Create account at sentry.io
# 2. Create new project (Node.js)
# 3. Get DSN

# 4. Set in environment:
SENTRY_DSN="https://xxx@sentry.io/yyy"
```

### Grafana Setup (Metrics)

```bash
# Run Prometheus + Grafana
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana

# Add data source
# Configure dashboards for:
# - API response times
# - Database queries
# - Redis memory
# - Payment transactions
```

### Log Aggregation (ELK / Loki)

```bash
# Option 1: ELK Stack
docker-compose -f docker-compose.elk.yml up -d

# Option 2: Loki (lighter)
docker-compose -f docker-compose.loki.yml up -d

# View logs
docker-compose logs -f backend
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Build Docker images
        run: docker-compose build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy to your platform (Railway/Render/etc.)
          # Or SSH to VPS and deploy
```

---

## 🛡️ Security Checklist

- [ ] SSL/TLS enabled on all domains
- [ ] JWT secrets stored in secret manager
- [ ] Database credentials not in code
- [ ] API rate limiting enabled
- [ ] CORS restricted to known origins
- [ ] HTTPS redirects configured
- [ ] Security headers (HSTS, CSP, X-Frame-Options)
- [ ] DDoS protection (Cloudflare, AWS Shield)
- [ ] Database encrypted at rest
- [ ] Regular security audits

---

## 🚨 Troubleshooting

### Pods crashing on startup
```bash
# Check logs
docker-compose logs backend

# Check database connectivity
docker-compose exec backend npm run prisma:migrate
```

### High latency
```bash
# Check database slow queries
docker-compose logs postgres | grep "slow"

# Monitor Redis
redis-cli MONITOR
```

### Payment failures
```bash
# Check webhook logs
docker-compose logs backend | grep "payment"

# Verify idempotency keys
```

---

## 📞 Support

- On-call rotation via Pagerduty
- Slack #dekora-alerts channel
- Status page: status.dekora.com
