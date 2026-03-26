# 📘 Guide complet d'utilisation — Sync Inventaire Excel

## 🎯 Table des matières

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Démarrage](#démarrage)
4. [Utilisation — Fournisseur](#utilisation--fournisseur)
5. [Utilisation — Admin](#utilisation--admin)
6. [Utilisation — Agent locals](#utilisation--agent-locaux)
7. [WebSocket en temps réel](#websocket-en-temps-réel)
8. [Dépannage](#dépannage)

---

## 🔧 Installation

### Prérequis

- **Node.js** 18+ et **npm** 9+
- **PostgreSQL** 15+ (local ou distant)
- **MinIO** (local dev) ou **AWS S3** (prod)
- **Git** (optionnel)

### 1. Cloner ou extraire le projet

```bash
cd Deka_test
```

### 2. Démarrer le setup automatique

**Windows:**
```bash
QUICKSTART.bat
```

**macOS/Linux:**
```bash
bash QUICKSTART.sh
```

### 3. Installer les dépendances manuellement (si needed)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend-web
npm install
```

---

## ⚙️ Configuration

### 1. Database PostgreSQL

**Create database:**
```sql
CREATE DATABASE deka_dev;
```

### 2. Fichier `.env` backend

Créer `backend/.env` (basé sur `.env.example`):

```env
# Database PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/deka_dev"

# JWT
JWT_SECRET="your-super-secret-min-32-characters-key"
JWT_EXPIRY="15m"

# Storage Provider (minio ou s3)
STORAGE_PROVIDER="minio"  # Changez à "s3" pour production

# MinIO (local development)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="deka-products"
MINIO_USE_SSL=false
MINIO_CDN_URL="http://localhost:9000"

# AWS S3 (production)
AWS_REGION="eu-west-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_S3_BUCKET="deka-products"
AWS_S3_CDN_URL="https://cdn.example.com"

# Server
PORT=3000
NODE_ENV="development"
```

### 3. Migrations base de données

```bash
cd backend
npm run prisma:migrate
# Accepter le nom suggéré ou entrer "init"
```

Vérifier que tout a fonctionné :
```bash
npx prisma studio
# Ouvre http://localhost:5555
```

---

## 🚀 Démarrage

### Terminal 1 — Backend NestJS

```bash
cd backend
npm run start:dev

# Output attendu:
# [Nest] 1234  - 03/26/2026, 10:30:00 AM
# Starting Nest application...
# Listening on port 3000
```

### Terminal 2 — Frontend Next.js

```bash
cd frontend-web
npm run dev

# Output attendu:
# ▲ Next.js 14.1.0
# - Local: http://localhost:3001
```

### Terminal 3 (Optional) — Prisma Studio

```bash
cd backend
npx prisma studio

# Ouvre http://localhost:5555 dans le navigateur
```

---

## 👤 Utilisation — Fournisseur

### 1. Accès au dashboard

🔗 **URL**: `http://localhost:3001/suppliers/inventory/upload`

### 2. Préparer le fichier Excel

**Format attendu:**
```
| nom_produit | prix_vente | commission | quantite_stock | description | reference_interne | url_image | ... |
|-------------|-----------|-----------|-----------------|-------------|-------------------|-----------|-----|
| Monitor 24" | 250000    | 5000      | 50              | Screen HD   | MON-24-001        | https://... |     |
```

**Colonnes requises:**

| Colonne | Type | Exemple | Notes |
|---------|------|---------|-------|
| `nom_produit` | String | Monitor 24" | Affiché à la vitrine |
| `prix_vente` | Nombre | 250000 | Prix client final |
| `commission` | Nombre | 5000 | Commission revendeur fixe |
| `quantite_stock` | Entier | 50 | 0 = désactiver produit |
| `description` | String | High def screen | Texte libre |
| `reference_interne` | String (UNIQUE) | MON-24-001 | Votre clé produit |
| `url_image` | URL | https://... | Image publique |

### 3. Télécharger le fichier

1. aller sur `/suppliers/inventory/upload`
2. Glisser-déposer le fichier Excel OU cliquer "Sélectionner"
3. Cliquer "Synchroniser l'inventaire"
4. Attendre le rapport

### 4. Voir le rapport

Après upload, vous verrez :
- ✅ Nombre de produits créés
- ✅ Nombre de produits mis à jour
- ✅ Nombre d'erreurs (avec détails)
- 📥 Option "Nouvel upload" pour relancer

### 5. Notifications temps réel

Si vous avez une connexion WebSocket active :
- 🔔 Notification quand upload commence
- 🔔 Notification quand upload termine
- 🔔 Message d'erreur immédiat si problème

---

## 👨‍💼 Utilisation — Admin

### 1. Accès au dashboard

🔗 **URL**: `http://localhost:3001/admin/syncs/dashboard`

### 2. Vue liste des syncs

**Vous verrez:**
- 📊 Cartes de stats: total syncs, produits créés/updatés, fournisseurs, taux erreur
- 📋 Tableau paginé de tous les syncs
- 🔍 Filtres: fournisseur, source, période

### 3. Filtrer les résultats

| Filtre | Options | Effet |
|--------|---------|-------|
| **Fournisseur** | ID ou email | Affiche syncs d'un fournisseur |
| **Source** | Upload Excel / Agent / Manual | Type de sync |
| **Période** | 7/30/90/365 jours | Statistiques calculées sur N jours |

### 4. Voir détails d'un sync

Cliquer sur "Voir détails →" pour :
- 📄 Informations détaillées (fournisseur, date, source)
- ❌ Table complète des erreurs par ligne
- 📥 Bouton "Export CSV" pour rapport
- 🔔 Notifications temps réel de nouveaux syncs

### 5. Export CSV

```bash
# Cliquer "Export CSV"
# Nom fichier: sync-{syncId}-2026-03-26.csv
# Format:
# Ligne,Référence Produit,Raison
# 5,MON-24-001,"URL image inaccessible"
# 8,KEY-456,"Prix vente invalid"
```

---

## 🤖 Utilisation — Agent locaux

### Option 1 — Mode Manuel (Dashboard fournisseur)

👉 Déjà documenté ci-dessus (Upload Excel)

### Option 2 — Mode Agent (Synchronisation locale)

**Pour fournisseurs avancés avec fichier Excel local.**

#### Setup agent

1. **Générer clé API:**
   - Aller dans dashboard fournisseur
   - Cliquer "Générer clé API agent"
   - Copier la clé (ex: `sk_abc123xyz...`)

2. **Installer agent (Node.js script):**
   ```bash
   # Sur le PC du fournisseur
   npm install -g deka-agent-cli
   deka-agent init
   # Entrer: API key, chemin dossier Excel, serveur URL
   ```

3. **Agent surveille le dossier:**
   ```bash
   deka-agent start
   # Affichage continu:
   # ✓ Watching /Users/supplier/inventory/
   # ✓ Connected to https://api.deka.com
   ```

#### Workflow agent

```
1. Fournisseur modifie Excel local
   └─ Agent détecte le changement immédiatement
      └─ Extrait UNIQUEMENT les lignes modifiées (diffs)
         └─ Envoie à /api/suppliers/inventory/agent-sync
            └─ Serveur applique les diffs
               └─ DB mise à jour
                  └─ WebSocket notifie admin
```

**Avantages:**
- ⚡ Sync continu, pas besoin upload manuel
- 🔒 Données restent physiquement chez le fournisseur
- 💾 Historique local complet
- 📊 Sync en arrière-plan

---

## 📡 WebSocket en temps réel

### Client — Se connecter

**React/Next.js:**
```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function SyncNotifications() {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    // Connecter au serveur
    const socket = io('http://localhost:3000/notifications');

    // Authentifier
    socket.emit('auth', {
      userId: 'supplier-123',
      token: localStorage.getItem('token'),
    });

    // Écouter les mises à jour
    socket.on('sync_started', () => {
      setStatus('Sync en cours...');
    });

    socket.on('sync_completed', (report) => {
      setStatus(`✓ ${report.productsCreated} créés`);
    });

    socket.on('sync_failed', (error) => {
      setStatus(`✗ ${error.message}`);
    });

    return () => socket.close();
  }, []);

  return <div>{status}</div>;
}
```

### Événements disponibles

| Événement | Quand | Données |
|-----------|-------|---------|
| `sync_started` | Upload commence | fileName, fileSize |
| `sync_completed` | Upload fini | productsCreated, updated, errors |
| `sync_failed` | Erreur upload | error message |
| `package_status_updated` | Livraison update | packageCode, status |

---

## 🐛 Dépannage

### ❌ Erreur: "Can't reach database"

**Cause**: PostgreSQL pas actif ou DATABASE_URL incorrect

**Solution**:
```bash
# Vérifier PostgreSQL
psql -U postgres -c "SELECT VERSION();"

# Vérifier DATABASE_URL
cat backend/.env | grep DATABASE_URL

# Format: postgresql://user:password@localhost:5432/deka_dev
```

### ❌ Erreur: "WebSocket disconnects"

**Cause**: CORS mal configuré ou JWT invalide

**Solution**:
```bash
# Vérifier console navigateur (F12 > Console)
# Chercher erreurs WebSocket

# Vérifier .env CORS_ORIGIN
cat backend/.env | grep CORS

# Vérifier JWT
# Token expiré ? Régénérer avec /auth/login
```

### ❌ Erreur: "Images not visible on CDN"

**Cause**: MinIO pas actif ou URL image invalide

**Solution**:
```bash
# Démarrer MinIO (si dev)
minio server /data

# Vérifier IMAGE_CDN_URL
cat backend/.env | grep CDN_URL

# Vérifier URL image dans Excel
# Doit être accessible: curl https://image.url
```

### ❌ Erreur: "Prisma client not found"

**Cause**: Prisma client pas généré

**Solution**:
```bash
cd backend
npm run prisma:generate
```

### ❌ Erreur lors du démarrage: "PORT 3000 already in use"

**Cause**: Autre processus utilise port 3000

**Solution**:
```bash
# Tuer processus (macOS/Linux)
lsof -i :3000 | grep npm | awk ' {print $2}' | xargs kill -9

# Tuer processus (Windows)
netstat -ano | findstr :3000
taskkill /PID {PID} /F

# Ou changer le port
export PORT=3001
npm run start:dev
```

---

## 📚 Documentation supplémentaire

| Document | Contenu |
|----------|---------|
| `CLAUDE.md` | Spécifications complètes (source de vérité) |
| `backend/MIGRATIONS_GUIDE.md` | Setup Prisma et migrations DB |
| `backend/WEBSOCKET_GUIDE.md` | Documentation WebSocket complète |
| `IMPLEMENTATION_SUMMARY.md` | Résumé technique de l'implémentation |
| `FILES_CHECKLIST.md` | Liste des fichiers créés/modifiés |

---

## ✅ Checklist avant le déploiement

- [ ] Database PostgreSQL configurée
- [ ] `.env` backend complété avec secrets
- [ ] Migrations Prisma exécutées
- [ ] MinIO ou AWS S3 configuré
- [ ] JWT_SECRET généré (>32 chars)
- [ ] CORS allowlist défini
- [ ] Tests manuels passés
- [ ] Backups DB configurés
- [ ] Monitoring activé (Sentry)
- [ ] Load balancer sticky sessions (WebSocket)

---

## 🎓 Exemples pratiques

### Exemple 1 — Fournisseur upload 100 produits

1. Créer Excel avec 100 lignes
2. Aller `/suppliers/inventory/upload`
3. Glisser-déposer
4. ⏳ Attendre 5-10 secondes
5. ✓ Voir rapport: 100 produits créés

### Exemple 2 — Admin surveille syncs en temps réel

1. Ouvrir `/admin/syncs/dashboard`
2. Ouvrir 2ème fenêtre pour fournisseur upload
3. Voir dashboard mise à jour LIVE
4. Cliquer "Voir détails" d'un sync
5. Voir erreurs et exporter CSV

### Exemple 3 — Notification WebSocket

1. Ouvrir `/suppliers/inventory/upload`
2. Ouvrir console navigateur (F12)
3. Uploader Excel
4. Voir dans console: "sync_started", "sync_completed"

---

## 📞 Support

Regardez d'abord:
1. Fichier `.md` pertinent (section Dépannage)
2. Logs console navigateur (F12)
3. Logs server terminal
4. Prisma Studio pour inspecter DB

---

**Version**: 1.0.0  
**Dernière mise à jour**: 26.03.2026  
**Statut**: Production Ready ✅
