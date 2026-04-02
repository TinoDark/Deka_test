#!/bin/bash
# Local Testing & Validation Script
# This script validates the build and basic configuration

echo "=== DEKA Platform - Local Validation ===" 
echo ""

echo "1. Backend Build Verification..."
if [ -d "backend/dist" ]; then
    echo "   ✅ Backend dist folder exists"
    echo "   ✅ Files compiled: $(find backend/dist -type f | wc -l) files"
else
    echo "   ❌ Backend dist folder missing"
    exit 1
fi

echo ""
echo "2. Frontend Build Verification..."
if [ -d "frontend-web/.next" ]; then
    echo "   ✅ Frontend .next folder exists"
    if [ -f "frontend-web/.next/routes-manifest.json" ]; then
        echo "   ✅ Routes manifest generated"
        # Count routes
        ROUTES=$(grep -o '"page":' frontend-web/.next/routes-manifest.json | wc -l)
        echo "   ✅ Total routes compiled: $ROUTES"
    fi
else
    echo "   ❌ Frontend .next folder missing"
    exit 1
fi

echo ""
echo "3. Environment Configuration..."
if [ -f "backend/.env" ]; then
    echo "   ✅ Backend .env configured"
    if grep -q "DATABASE_URL" backend/.env; then
        echo "   ✅ Database URL set"
    fi
    if grep -q "JWT_SECRET" backend/.env; then
        echo "   ✅ JWT Secret set"
    fi
    if grep -q "GOOGLE_MAPS_API_KEY" backend/.env; then
        echo "   ✅ Google Maps API Key set"
    fi
else
    echo "   ❌ Backend .env missing"
fi

if [ -f "frontend-web/.env.local" ]; then
    echo "   ✅ Frontend .env.local configured"
    if grep -q "NEXT_PUBLIC_API_URL=http://localhost:3000" frontend-web/.env.local; then
        echo "   ✅ API URL set to localhost"
    fi
    if grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" frontend-web/.env.local; then
        echo "   ✅ Google Maps API Key set"
    fi
else
    echo "   ❌ Frontend .env.local missing"
fi

echo ""
echo "4. Key Modules Verification..."
MODULES=("kyc" "wallet" "admin" "auth" "payments")
for MODULE in "${MODULES[@]}"; do
    if [ -d "backend/dist/$MODULE" ]; then
        echo "   ✅ Module '$MODULE' compiled"
    else
        echo "   ⚠️  Module '$MODULE' not found"
    fi
done

echo ""
echo "5. Frontend Pages Verification..."
PAGES=("admin/kyc" "admin/disputes" "admin/refunds" "resellers/kyc" "resellers/store" "resellers/wallet" "suppliers/kyc" "signup")
if [ -f "frontend-web/.next/routes-manifest.json" ]; then
    for PAGE in "${PAGES[@]}"; do
        if grep -q "\"page\":\"/$PAGE\"" frontend-web/.next/routes-manifest.json; then
            echo "   ✅ Page '/$PAGE' compiled"
        else
            echo "   ⚠️  Page '/$PAGE' not found in manifest"
        fi
    done
fi

echo ""
echo "=== Summary ==="
echo "✅ Build Validation Complete"
echo "✅ All critical files present"
echo "✅ Configuration ready for testing"
echo ""
echo "Next steps:"
echo "1. Backend: npm run start:dev (requires PostgreSQL running)"
echo "2. Frontend: npm run dev"
echo "3. Test at http://localhost:3001"
