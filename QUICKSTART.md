# Deka Quickstart Guide

## 🚀 Quick Setup (5 minutes)

### 1. Prerequisites
```bash
# Check Node.js
node --version  # Should be v20+

# Check Docker
docker --version
docker-compose --version
```

### 2. Clone & Setup
```bash
cd deka

# Copy environment file
cp .env.example .env

# Start all services with Docker
docker-compose up -d
```

### 3. Initialize Database
```bash
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma db seed
```

### 4. Access Platforms
- 🌐 **Frontend**: http://localhost:3001
- 📊 **Dashboard**: http://localhost:3002
- 🔗 **API**: http://localhost:3000
- 💾 **DB Admin**: pgAdmin on port 5050

### 5. Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@deka.com | admin123 |
| Supplier | supplier1@deka.com | supplier123 |
| Reseller | reseller1@deka.com | reseller123 |

---

## 🛑 Common Issues

**Q: Port already in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Q: Database migration failed?**
```bash
# Reset database
docker-compose exec backend npx prisma migrate reset
```

**Q: Services won't start?**
```bash
# View logs
docker-compose logs -f backend

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Next Steps

1. Read [CLAUDE.md](CLAUDE.md) for architecture
2. Check [README.md](README.md) for full docs
3. Explore [backend/README.md](backend/README.md) for API
4. Start developing! 🎉
