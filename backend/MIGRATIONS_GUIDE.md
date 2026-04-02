# Guide d'Installation & Migration DB

## Prérequis

Assurez-vous d'avoir :
- PostgreSQL 15+ en cours d'exécution
- Une base de données créée ou une connection string valide
- Variables d'environnement configurées (voir `.env.example`)

## Configuration `.env`

Créez un fichier `.env` à la racine du dossier `backend/` :

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/deka_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRY="15m"

# Storage (MinIO ou S3)
STORAGE_PROVIDER="minio"  # ou "s3"

# MinIO (si STORAGE_PROVIDER=minio)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="deka-products"
MINIO_USE_SSL=false
MINIO_CDN_URL="http://localhost:9000"

# AWS S3 (si STORAGE_PROVIDER=s3)
AWS_REGION="eu-west-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="deka-products"
AWS_S3_CDN_URL="https://d123.cloudfront.net"

# Mobile Money (exemple mix_by_yas)
MIX_BY_YAS_API_KEY="your-mix_by_yas-key"
MIX_BY_YAS_CALLBACK_URL="https://your-domain.com/payments/callback"

# Server
PORT=3000
NODE_ENV="development"
```

## 3️⃣ Installation des dépendances

```bash
cd backend
npm install
```

## 4️⃣ Créer & Appliquer les migrations

### Première fois (mode développement)

```bash
# Crée la migration ET applique les changements
npm run prisma:migrate

# Vous pouvez nommer la migration, ex: "initial_schema"
```

### Générer Prisma Client

```bash
npm run prisma:generate
```

### Voir l'état de la base de données

```bash
# Ouvre Prisma Studio (UI visuelle)
npx prisma studio
```

## 5️⃣ Seed initial (optionnel)

Injecter des données de test :

```bash
npm run prisma:seed
```

## 6️⃣ Démarrer le serveur

```bash
# Mode développement (hot reload)
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

---

## Modèles créés

Après les migrations, vous aurez les tables suivantes :

| Table | Description |
|---|---|
| `User` | Utilisateurs (4 rôles: SUPPLIER, RESELLER, DELIVERY, ADMIN) |
| `Product` | Produits du catalogue |
| `AgentKey` | Clés API pour agents locaux (sync) |
| `SyncReport` | Historique des synchronisations Excel |
| `Order` | Commandes |
| `OrderItem` | Ligne itemss de commande + logistics |
| `Payment` | Transactions paiement Mobile Money |
| `PayoutRequest` | Demandes de retrait (commission revendeur) |
| `Refund` | Historique remboursements (audit) |

---

## Vérifier l'état

```bash
# Voir les migrations appliquées
npx prisma migrate status

# Réinitialiser la DB (DESTRUCTIF! dev seulement)
npx prisma migrate reset --force
```

---

## Troubleshooting

### Erreur: "Can't reach database server"
→ Vérifier `DATABASE_URL` et que PostgreSQL est actif

### Erreur: "Migration already applied"
→ C'est normal lors des réapplications

### Réinitialiser complètement (DEV UNIQUEMENT)
```bash
npx prisma migrate reset --force
npm run prisma:seed
```

---

## Production

En production, utilisez :

```bash
npx prisma migrate deploy
```

Cela applique les migrations **sans** créer de nouvelles.

---

*Généré pour Deka Social-Commerce Platform*
