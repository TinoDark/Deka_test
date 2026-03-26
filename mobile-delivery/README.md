# Deka Mobile Delivery App - React Native (Expo)

## 📱 Overview

App mobile native pour les livreurs avec support **offline-first** utilisant SQLite pour la synchronisation asynchrone.

## 🎯 Fonctionnalités Principales

### Écrans Implémentés (À faire)
- [ ] **Tasks Screen** — Liste des livraisons assignées
- [ ] **Scanner Screen** — Scan/saisie code colis (AAMMJJ-XXXX)
- [ ] **Map Screen** — GPS + trajet + directions
- [ ] **Profile Screen** — Infos livreur + statistiques

### Mode Offline
- ✅ Scan fonctionne sans réseau
- ✅ Données stockées en SQLite local
- ✅ Sync automatique au retour du réseau
- ✅ Résolution de conflits côté serveur

## 🚀 Installation

```bash
cd mobile-delivery

# Install dependencies
npm install

# Start Expo
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📂 Structure

```
mobile-delivery/
├── app/
│   └── index.tsx          # Navigation principale
├── screens/
│   ├── TasksScreen.tsx    # Liste livrables
│   ├── ScannerScreen.tsx  # Scan code + saisie
│   ├── MapScreen.tsx      # GPS + trajet
│   └── ProfileScreen.tsx  # Profil livreur
├── components/
│   ├── PackageCard.tsx    # Carte colis
│   ├── BarcodeScanner.tsx # Scanner
│   └── MapView.tsx        # Affichage GPS
├── lib/
│   ├── database.ts        # SQLite offline
│   └── store.ts           # Zustand state
└── package.json
```

## 🔧 Configuration

### .env Local

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_ENV=development
```

## 📦 Base de Données (SQLite)

### Tables Offline

```sql
-- sync_queue : Requêtes en attente
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  endpoint TEXT,
  method TEXT,
  body TEXT,
  retries INT,
  created_at INTEGER
);

-- delivery_tasks : Tâches livreur
CREATE TABLE delivery_tasks (
  id TEXT PRIMARY KEY,
  package_code TEXT UNIQUE,
  status TEXT,
  customer_name TEXT,
  collected_at INTEGER
);

-- offline_updates : Historique
CREATE TABLE offline_updates (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  action TEXT,
  payload TEXT
);
```

## 🌐 Sync Workflow

```
1. Livreur accepte tâche (online)
   ↓
2. Scan colis (peut être offline)
   → Données sauvegardées en SQLite local
   ↓
3. Réseau revient
   → Triggeering sync auto
   ↓
4. API reçoit update
   → Résout conflits (serveur a raison)
   → Retourne confirmation
   ↓
5. SQLite mis à jour
   → UI rafraîchie (via Zustand)
```

## 🔐 Security

- JWT token stocké en Expo SecureStore (pas localStorage)
- Validation signature webhook
- Refresh token auto-renew

## 🧪 Testing

```bash
# Run tests
npm test

# Debugging
npm start -- --dev

# Build APK
eas build --platform android

# Build IPA
eas build --platform ios
```

## 🚀 Deployment

### iOS App Store

```bash
eas build --platform ios -—production
eas submit --platform ios
```

### Google Play

```bash
eas build --platform android --production
eas submit --platform android
```

## 📚 Documentation

- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Zustand](https://github.com/pmndrs/zustand)
- [Main README](../README.md)
