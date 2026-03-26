#!/bin/bash

# 🚀 QUICK START — Deka Sync Excel Module
# Démarrage complet en 5 minutes

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deka Sync Excel Module — Quick Start${NC}"
echo "================================================"
echo ""

# ============================================
# 1️⃣  SETUP BACKEND
# ============================================

echo -e "${YELLOW}1️⃣  Setup Backend...${NC}"

cd backend

echo "   📦 Installed dependencies..."
npm install --silent 2>/dev/null || npm install

echo "   🗄️  Generating Prisma client..."
npm run prisma:generate --silent 2>/dev/null || true

echo "   🔄 Running migrations..."
npm run prisma:migrate --silent 2>/dev/null || echo "   ⚠️  Skip migrations (manual setup)"

echo ""

# ============================================
# 2️⃣  ENV CONFIGURATION
# ============================================

echo -e "${YELLOW}2️⃣  Configuration...${NC}"

if [ ! -f ".env" ]; then
    echo "   📝 Creating .env from template..."
    cp .env.example .env 2>/dev/null || echo "   ⚠️  .env.example not found"
    echo -e "   ${GREEN}✓${NC} Edit backend/.env with your settings"
else
    echo "   ✓ .env already exists"
fi

echo ""

# ============================================
# 3️⃣  FRONTEND SETUP
# ============================================

echo -e "${YELLOW}3️⃣  Setup Frontend...${NC}"

cd ../frontend-web

echo "   📦 Installing dependencies..."
npm install --silent 2>/dev/null || npm install

echo ""

# ============================================
# 4️⃣  DISPLAY ENDPOINTS
# ============================================

echo -e "${BLUE}✅ Setup Complete!${NC}"
echo ""
echo -e "${GREEN}📚 Available Endpoints:${NC}"
echo ""
echo "   Backend:"
echo "     REST API:    http://localhost:3000/api"
echo "     WebSocket:   ws://localhost:3000/notifications"
echo ""
echo "   Frontend:"
echo "     Supplier:    http://localhost:3001/suppliers/inventory/upload"
echo "     Admin:       http://localhost:3001/admin/syncs/dashboard"
echo ""

# ============================================
# 5️⃣  STARTUP COMMANDS
# ============================================

echo -e "${GREEN}🚀 Startup Commands:${NC}"
echo ""

echo "   Terminal 1 (Backend):"
echo "     cd backend"
echo "     npm run start:dev"
echo ""

echo "   Terminal 2 (Frontend):"
echo "     cd frontend-web"
echo "     npm run dev"
echo ""

echo "   Terminal 3 (Prisma Studio - optional):"
echo "     cd backend"
echo "     npx prisma studio"
echo ""

# ============================================
# 6️⃣  TESTING
# ============================================

echo -e "${GREEN}✨ Quick Tests:${NC}"
echo ""
echo "   1. Fournisseur:"
echo "      - Allez sur http://localhost:3001/suppliers/inventory/upload"
echo "      - Téléchargez un fichier Excel"
echo ""
echo "   2. Admin:"
echo "      - Allez sur http://localhost:3001/admin/syncs/dashboard"
echo "      - Voyez la liste des syncs"
echo ""
echo "   3. WebSocket:"
echo "      - Inspecter la console pour les logs WebSocket"
echo ""

echo -e "${YELLOW}📖 Documentation:${NC}"
echo ""
echo "   - backend/MIGRATIONS_GUIDE.md     (Database setup)"
echo "   - backend/WEBSOCKET_GUIDE.md      (Real-time notifications)"
echo "   - IMPLEMENTATION_SUMMARY.md       (Full overview)"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Ready to code! 🎉${NC}"
echo -e "${GREEN}================================================${NC}"
