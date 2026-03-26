# 🚀 DEKA — Plateforme Social-Commerce as a Service

Plateforme complète permettant à des vendeurs indépendants de distribuer les produits de grossistes via leurs réseaux sociaux, sans stock ni logistique complexe.

## 📋 Table des Matières

- [Architecture](#architecture)
- [Stack Technologique](#stack-technologique)
- [Prérequis](#prérequis)
- [Installation & Démarrage](#installation--démarrage)
- [Structure du Projet](#structure-du-projet)
- [Endpoints API](#endpoints-api)
- [Rôles & Permissions](#rôles--permissions)
- [Documentation](#documentation)

---

## 🏗️ Architecture

La plateforme suit une architecture microservices en 5 couches :

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTS                                                     │
│  • Vitrine Client (PWA)                                      │
│  • Dashboard Revendeur (PWA)                                 │
│  • Dashboard Fournisseur (PWA)                               │
│  • Panel Admin (Web)                                         │
│  • App Livreur (React Native - offline-first)                │
├─────────────────────────────────────────────────────────────┤
│  GATEWAY                                                     │
│  • API Gateway (JWT + RBAC + Rate Limit)                     │
│  • WebSocket (statuts temps réel)                            │
│  • Sync Queue (offline sync)                                 │
├─────────────────────────────────────────────────────────────┤
│  SERVICES (NestJS - Microservices)                           │
│  • Catalogue | Commandes (Escrow) | Paiement | Logistique   │
│  • Wallet/Payout | Admin/KYC | Notifications                │
│  • Redis Pub/Sub (événements)                                │
├─────────────────────────────────────────────────────────────┤
│  DATA                                                        │
│  • PostgreSQL 15+ (ACID · finances)                          │
│  • Redis 7+ (cache · pub/sub)                                │
│  • MinIO S3 (images)                                         │
│  • SQLite (device offline)                                   │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL                                                    │
│  • Mobile Money (MTN · Orange · Wave)                        │
│  • SMS/Push Notifications                                    │
│  • GPS / Maps                                                │
```

---

## 💻 Stack Technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Backend** | Node.js + NestJS | 20.x / ^10.3.0 |
| **Frontend Web** | Next.js 14 + React 18 | ^14.0.0 / ^18.2.0 |
| **Mobile Livreur** | React Native (Expo) | 0.73.2 |
| **Base Données** | PostgreSQL | 15+ |
| **Cache & Pub/Sub** | Redis | 7+ |
| **Storage** | MinIO (S3-compatible) | latest |
| **ORM** | Prisma | ^5.7.1 |
| **Auth** | JWT + Passport.js | - |
| **Déploiement** | Docker + docker-compose | - |

---

## 📦 Prérequis

- **Docker & Docker Compose** (recommandé)
- **Node.js 20+** (pour dev local)
- **npm 10+** ou **yarn**
- **Git**

---

## 🚀 Installation & Démarrage

### Option 1 : Docker Compose (Recommandé)

```bash
# Clone le repository
git clone https://github.com/your-org/deka.git
cd deka

# Créer le .env local (à partir du template)
cp .env.example .env

# Lancer tous les services
docker-compose up -d

# Vérifier que tout est en place
docker-compose ps
```

**Services disponibles :**  
- 🔌 Backend API: http://localhost:3000
- 🛍️ Client Shop: http://localhost:3001
- 📊 Reseller Dashboard: http://localhost:3002  
- 📦 Supplier Dashboard: http://localhost:3003
- ⚙️ Admin Panel: http://localhost:3004
- 💾 PostgreSQL: localhost:5432
- 🔴 Redis: localhost:6379
- 📦 MinIO: http://localhost:9001

### Option 2 : Développement Local

```bash
# Installer les dépendances backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# Dans un autre terminal - Frontend
cd frontend-web
npm install
npm run dev

# Dans un autre terminal - Mobile Livreur
cd mobile-delivery
npm install
npm start
```

---

## 📂 Structure du Projet

```
deka/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── auth/              # Authentification & JWT
│   │   ├── catalog/           # Catalogue produits
│   │   ├── orders/            # Gestion commandes + Escrow
│   │   ├── payments/          # Intégration Mobile Money
│   │   ├── logistics/         # Routage & tracking
│   │   ├── wallet/            # Wallet & Payouts
│   │   ├── admin/             # Panel admin & KYC
│   │   └── common/            # Guards, Prisma, DTOs
│   ├── prisma/
│   │   └── schema.prisma      # Modèles de données
│   └── package.json
├── frontend-web/               # Dashboards web (Next.js)
│   ├── app/                   # Pages par rôle
│   ├── components/            # Composants réutilisables
│   ├── lib/                   # Utils, API, store Zustand
│   └── package.json
├── mobile-delivery/            # App livreur (React Native)
│   ├── app/                   # Navigation
│   ├── screens/               # Écrans
│   ├── lib/                   # SQLite offline, store
│   └── package.json
├── docker-compose.yml         # Infrastructure Docker
├── .env.example               # Variables d'environnement
├── CLAUDE.md                  # Documentation architecture
└── README.md                  # Ce fichier
```

---

## 🔌 Endpoints API Principaux

### Authentification
```
POST   /auth/login                    Connexion user
POST   /auth/register                 Inscription (4 rôles)
POST   /auth/verify-token             Vérification JWT
```

### Catalogue & Produits
```
GET    /catalog                       Tous les produits (pagination)
GET    /catalog?category=X            Produits filtrés
POST   /products                      Créer produit (SUPPLIER)
PATCH  /products/:id                  Mettre à jour produit
```

### Commandes
```
POST   /orders                        Créer commande
GET    /orders/:id                    Détail commande
GET    /orders                        Liste mes commandes
PATCH  /orders/:id/status             Mettre à jour statut
```

### Paiements
```
POST   /payments/callback             Webhook Mobile Money [idempotent]
GET    /payments/:id                  Détail paiement
```

### Logistique
```
GET    /logistics/deliveries          Liste des livraisons
PATCH  /logistics/package/:code       Update statut colis
POST   /logistics/package/:code/reject Rejeter un colis
```

### Wallet & Payouts
```
GET    /wallet/balance                Solde wallet
POST   /payouts/request               Demander un retrait
GET    /payouts/:id                   Détail payout
```

### Admin
```
PATCH  /admin/kyc/:userId             Valider/Rejeter KYC
POST   /admin/refunds                 Remboursement manuel
GET    /admin/disputes                Litiges
PATCH  /admin/disputes/:id            Résoudre litige
```

---

## 👥 Rôles & Permissions

### 1. **SUPPLIER** (Fournisseur)
- ✅ Gérer inventaire (activer/désactiver)
- ✅ Confirmer préparation colis
- ✅ Consulter historique ventes
- ❌ Voir clients finaux
- ❌ Modifier prix final

### 2. **RESELLER** (Revendeur)
- ✅ Sélectionner produits (curation)
- ✅ Personnaliser URL boutique
- ✅ Suivre commissions (Wallet)
- ✅ Soumettre KYC
- ❌ Modifier prix
- ❌ Contacter fournisseurs

### 3. **DELIVERY** (Livreur/Hub)
- ✅ Accepter courses
- ✅ Scanner colis (AAMMJJ-XXXX)
- ✅ Valider étapes (Collecte → Hub → Livraison)
- ✅ Signaler rejet
- ❌ Accès limité aux données nécessaires

### 4. **ADMIN**
- ✅ Accès total
- ✅ Valider KYC
- ✅ Gérer litiges
- ✅ Remboursement manuel
- ✅ Modérer catalogue

---

## 🔐 Sécurité

- **JWT**: Durée de vie courte (15min access token + 7j refresh)
- **RBAC**: Middleware sur chaque endpoint
- **Escrow**: Isolation stricte des fonds (transactions ACID)
- **Callback webhooks**: Signature + idempotency key
- **RGPD**: Fournisseurs ne voient pas les clients finaux

---

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** — Architecture technique complète
- **[API Docs](backend/README.md)** — Documentation API détaillée
- **[Mobile App Docs](mobile-delivery/README.md)** — Documentation app livreur

---

## 🛠️ Développement

### Backend

```bash
cd backend

# Migrations Prisma
npx prisma migrate dev --name "init"
npx prisma generate

# Seed data
npx prisma db seed

# Tests
npm run test

# Build production
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend-web

# Dev server
npm run dev

# Build production
npm run build
npm start
```

### Mobile

```bash
cd mobile-delivery

# Start Expo Go
npm start

# Build APK/IPA
eas build
```

---

## 🚁 Déploiement

### Sur Render.com / Railway

1. Pousser le code sur GitHub
2. Créer un projet Render/Railway
3. Configurer les variables d'environnement
4. Déployer automatiquement depuis main

### Sur VPS (Digital Ocean, Linode)

```bash
# SSH sur le serveur
ssh root@your-vps

cd /var/www/deka

# Pull latest
git pull origin main

# Rebuild & restart
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

---

## 📊 Monitoring

- **Sentry** — Erreurs & exceptions
- **Grafana** — Métriques (CPU, mémoire, requêtes)
- **Redis Commander** — Inspect cache
- **pgAdmin** — Gestion PostgreSQL

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Créer une branche `feature/your-feature`
2. Valider avec les tests unitaires
3. Soumettre une PR

---

## 📄 License

MIT — Libre d'utilisation

---

## 📞 Support

- 💬 Slack: #deka-dev
- 📧 Email: dev@deka.com
- 🐛 Issues: GitHub Issues

---

**🌍 Fait avec ❤️ par Deka Team**
#   D e k a _ t e s t  
 