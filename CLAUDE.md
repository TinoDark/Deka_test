# CLAUDE.md — Plateforme Social-Commerce as a Service

> Fichier de référence pour le développement. À placer à la racine du projet.
> Utilisable comme contexte système pour tout assistant IA (Claude, Cursor, Copilot…).

---

## 1. CONTEXTE DU PROJET

### Description
Application **Social-Commerce as a Service** permettant à des vendeurs indépendants de distribuer les produits de grossistes via leurs réseaux sociaux, sans stock ni logistique complexe.

### Valeur ajoutée par rôle
- **Fournisseur** — Liquidation rapide des stocks via un canal digital massif
- **Revendeur** — Entrepreneuriat zéro capital, commissions garanties
- **Livreur** — Flux de travail guidé (Direct vs Hub)
- **Admin** — Contrôle total : conformité, sécurité financière, satisfaction client

---

## 2. RÔLES ET PERMISSIONS

### Fournisseur
- Gérer son inventaire (activer/désactiver un produit)
- Confirmer la préparation des colis
- Consulter l'historique de ses ventes
- **Interdit** : voir les clients finaux des revendeurs, modifier le prix final
- **Accès** : lecture/écriture sur ses propres produits uniquement

### Revendeur
- Sélectionner des produits (curation du catalogue)
- Personnaliser son URL de boutique
- Suivre ses commissions (Wallet)
- Soumettre son KYC
- **Interdit** : modifier les prix, contacter les fournisseurs en direct
- **Accès** : catalogue global + son propre portefeuille

### Livreur / Agent Hub
- Accepter une course
- Saisir ou scanner les codes colis (`AAMMJJ-XXXX`)
- Valider les étapes : Collecte → Hub → Livraison
- Signaler un rejet
- **Accès** : uniquement les données nécessaires à la livraison

### Administrateur
- Valider les comptes (KYC)
- Gérer les litiges
- Effectuer les remboursements manuels
- Modérer le catalogue
- **Accès** : Super-Admin (accès total)

---

## 3. ARCHITECTURE TECHNIQUE

### Vue d'ensemble (5 couches)

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTS                                                     │
│  Vitrine (PWA)  │  Revendeur (PWA)  │  Fournisseur (PWA)   │
│  Livreur (App native React Native / Flutter + offline)       │
├─────────────────────────────────────────────────────────────┤
│  GATEWAY                                                     │
│  CDN/Edge  │  API Gateway (JWT · RBAC · Rate limit)         │
│  WebSocket (statuts temps réel)  │  Sync Queue (offline)    │
├─────────────────────────────────────────────────────────────┤
│  SERVICES (NestJS — microservices découplés)                 │
│  Catalogue │ Commandes (Escrow) │ Paiement │ Logistique     │
│  Wallet/Payout │ Admin/KYC │ Notifications                  │
│  Message Bus : Redis Pub/Sub (événements inter-services)     │
├─────────────────────────────────────────────────────────────┤
│  DATA                                                        │
│  PostgreSQL (ACID · finances)  │  Redis (cache · pub/sub)   │
│  Object Storage S3 + CDN (images)  │  SQLite (device off.)  │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL                                                    │
│  Mobile Money (mix_by_yas · Moov Money)  │  SMS/Push            │
│  GPS / Maps (OSM · Google Maps)  │  KYC provider            │
└─────────────────────────────────────────────────────────────┘
```

### Décisions clés

| Décision | Choix | Raison |
|---|---|---|
| Frontend revendeur/fournisseur | PWA (React / Next.js) | Une codebase web + mobile |
| Frontend livreur | App native (React Native ou Flutter) | Offline, caméra, push fiable |
| Backend | Node.js / NestJS | Gestion asynchrone des événements |
| Base principale | PostgreSQL | Transactions ACID pour les finances |
| Cache / Bus | Redis | Statuts temps réel + Pub/Sub |
| Images | CDN (S3-compatible) | Chargement < 2s sur mobile |
| Offline livreur | SQLite sur device → sync API | Zones sans réseau |

---

## 4. MODÈLES DE DONNÉES

```typescript
User {
  id: uuid
  role: 'supplier' | 'reseller' | 'delivery' | 'admin'
  kyc_status: 'pending' | 'approved' | 'rejected'
  wallet_balance: decimal
}

Product {
  id: uuid
  supplier_id: uuid             // FK → User (role: supplier)

  // Identité — remplis automatiquement depuis le fichier Excel
  reference_interne: string     // clé fournisseur, UNIQUE par supplier_id
  nom_produit: string
  description: string | null
  caracteristique: string | null  // champ libre optionnel
  categorie: string | null
  image_url: string             // URL fournie dans l'Excel (hébergée chez le fournisseur)
  image_cdn_url: string | null  // copie mise en cache sur notre CDN après vérification

  // Prix & commission (définis par le fournisseur dans l'Excel)
  prix_vente: decimal           // prix affiché au client final
  commission: decimal           // montant fixe en devise locale
  pourcentage_commission: decimal // ex: 15.00 pour 15%
  // prix_gros (implicite) = prix_vente - commission

  // Stock
  stock_quantity: integer       // 0 → is_active = false automatiquement
  is_active: boolean            // false si stock=0 OU désactivé manuellement

  // Traçabilité sync
  last_synced_at: timestamp
  sync_source: 'excel_upload' | 'agent' | 'dashboard_manual'
  created_at: timestamp
  updated_at: timestamp
}

Order {
  id: uuid
  reseller_id: uuid (FK → User)
  status: 'pending' | 'paid' | 'processing' | 'delivered' | 'cancelled'
  total_amount: decimal
  escrow_balance: decimal   // fonds bloqués jusqu'à livraison confirmée
}

OrderItem {
  id: uuid
  order_id: uuid (FK → Order)
  product_id: uuid (FK → Product)
  package_code: string      // format AAMMJJ-XXXX
  status: 'prepared' | 'collected' | 'at_hub' | 'delivered' | 'rejected'
  delivery_type: 'direct' | 'hub'
}
```

---

## 5. FLUX TECHNIQUES CRITIQUES

### Flux Commande (chemin principal)
```
Client paie (Mobile Money)
  → POST /payments/callback  [idempotent !]
  → Vérification paiement en DB (éviter doublons)
  → Création Order + escrow en une seule transaction PostgreSQL
  → Calcul routage : 1 fournisseur → Direct | >1 fournisseur → Hub
  → Génération package_codes (format AAMMJJ-XXXX)
  → Pub/Sub : événement "order.created"
  → Service Logistique consomme → notifie fournisseurs + livreurs
  → Service Notifs consomme → SMS/Push au client
```

### Flux Livraison (livreur mobile)
```
Livreur accepte course
  → PATCH /logistics/package/{code}  { status: 'collected' }
  → [si offline] → SQLite local → queue sync
  → [retour réseau] → push API → résolution conflits serveur
  → Statut mis à jour → WebSocket → dashboard revendeur
  → Toutes étapes OK → libération escrow → crédit commission revendeur
```

### Flux Payout (revendeur)
```
Revendeur demande retrait
  → POST /payouts/request
  → Vérification KYC approved
  → Vérification solde wallet
  → Création entrée Journal de Remboursements (traçabilité comptable)
  → Virement Mobile Money
  → Débit wallet
```

### Flux Connexion (RBAC)
```
Login
  → Vérification credentials
  → Génération JWT (durée de vie courte)
  → Lecture role en DB
  → Redirection :
      supplier  → /dashboard/supplier
      reseller  → /dashboard/reseller
      delivery  → App native (deep link)
      admin     → /admin
```

---

## 6. ENDPOINTS CRITIQUES

```
POST   /auth/login                          Auth + redirection rôle
POST   /payments/callback                   Callback Mobile Money [idempotent]
PATCH  /logistics/package/{code}            Mise à jour statut par livreur
POST   /payouts/request                     Demande de retrait commission
GET    /catalog                             Catalogue global (revendeur)
POST   /orders                              Création commande (client)
GET    /orders/{id}                         Détail commande
PATCH  /admin/kyc/{userId}                  Validation KYC (admin)
POST   /admin/refunds                       Remboursement manuel (admin)
```

---

## 7. SÉCURITÉ

- **Auth** : JWT avec durée de vie courte (ex. 15min access + refresh token)
- **RBAC** : middleware sur chaque endpoint vérifiant le rôle en DB
- **Escrow** : isolation stricte des fonds en DB (jamais modifiables hors transaction validée)
- **Callback paiement** : vérification signature webhook + idempotency key
- **RGPD / données** : le fournisseur ne voit jamais les clients finaux du revendeur

---

## 8. INTERFACES UI/UX

### Vitrine Client (web + PWA mobile)
- E-commerce classique ultra-rapide, optimisé mobile
- Écrans : boutique revendeur → panier → paiement Mobile Money
- Objectif : conversion maximale, chargement < 2s

### Dashboard Revendeur (web + PWA mobile)
- Orienté "tableau de bord simple"
- Écrans : Dashboard (stats gains) · Catalogue (curation) · Boutique (aperçu public) · Wallet (retraits)
- Composants : cartes produits, indicateurs de performance, URL personnalisée

### Dashboard Fournisseur (web + PWA mobile)
- Écrans : Inventaire (switch actif/inactif) · Préparation colis · Historique ventes
- Composants : toggle disponibilité, liste commandes à préparer

### App Livreur (mobile natif)
- Orientée "action terrain" : utilisable à une main, mode sombre
- Écrans : liste tâches (Pickup/Deliver) · Scanner/Saisie code · Détail trajet GPS
- Composants : boutons massifs, saisie alphanumérique, indicateur offline
- **Offline first** : toutes les actions de scan fonctionnent sans réseau

### Interface Admin (web)
- File d'attente KYC · Gestion litiges · Journal remboursements · Modération catalogue

---

## 9. RECOMMANDATIONS TECHNIQUES

1. **Format code colis** : `AAMMJJ-XXXX` (date + hash 4 chars) — court pour saisie manuelle, suffisant contre les collisions quotidiennes

2. **KYC** : file d'attente d'approbation admin + système de tiers de confiance pour ne pas bloquer l'onboarding

3. **Remboursements** : même manuels, toujours passer par le Journal de Remboursements (traçabilité comptable, prévention doublons)

4. **Performance** : CDN obligatoire pour les images fournisseurs — objectif < 2s sur mobile 3G

5. **Idempotence** : le callback `/payments/callback` doit utiliser une `idempotency_key` pour éviter la double-création de commande en cas de retry

6. **Escrow** : la création de l'order ET la mise à jour de l'escrow doivent être dans la **même transaction PostgreSQL**

7. **Offline livreur** : résolution de conflits côté serveur (le serveur a toujours raison pour les timestamps)

---

## 10. STACK RECOMMANDÉE

```
Backend      : Node.js + NestJS (TypeScript)
Frontend web : Next.js 14+ (App Router) + Tailwind CSS
Mobile livr. : React Native (Expo) ou Flutter
Base données : PostgreSQL 15+
Cache / Bus  : Redis 7+
Storage      : MinIO (self-hosted) ou S3 + CloudFront/Cloudflare
Auth         : JWT + Passport.js (NestJS)
ORM          : Prisma ou TypeORM
Déploiement  : Docker + docker-compose → VPS ou Railway/Render
Monitoring   : Sentry (erreurs) + Grafana (métriques)
```

---

## 11. ORDRE D'IMPLÉMENTATION (PRIORITÉS)

### Phase 1 — Cœur transactionnel
- [ ] Auth + RBAC (JWT, 4 rôles)
- [ ] Modèles DB (User, Product, Order, OrderItem)
- [ ] Intégration Mobile Money (callback idempotent + escrow)
- [ ] Création de commande end-to-end

### Phase 2 — Logistique
- [ ] Algorithme de routage (Direct vs Hub)
- [ ] Génération package_codes
- [ ] PATCH statut livreur + WebSocket temps réel
- [ ] Offline sync (SQLite → API)

### Phase 3 — Interfaces
- [ ] Vitrine client (boutique revendeur)
- [ ] Dashboard revendeur (catalogue + wallet)
- [ ] App livreur (scan + GPS)
- [ ] Dashboard fournisseur (inventaire)

### Phase 4 — Admin & finitions
- [ ] Interface admin (KYC, litiges, remboursements)
- [ ] Notifications (SMS, Push, Email)
- [ ] CDN images + optimisations performance
- [ ] Journal de remboursements

---

---

## 12. MODULE SYNC INVENTAIRE EXCEL (Fournisseur)

### Objectif
Permettre au fournisseur de gérer son stock dans son fichier Excel local, tout en synchronisant automatiquement le catalogue de la plateforme. Garantie : les données brutes du fournisseur ne sont jamais stockées sur le serveur.

### Deux modes de synchronisation

**Mode A — Upload manuel (priorité MVP)**
Le fournisseur uploade son `.xlsx` depuis le dashboard. Le serveur le parse, crée ou met à jour tous les produits, puis supprime le fichier immédiatement après traitement.

**Mode B — Agent local (fournisseurs avancés)**
Un exécutable léger installé sur le PC du fournisseur. Il surveille le fichier Excel avec `chokidar`, détecte les changements ligne par ligne, et envoie uniquement les diffs à l'API. Les données restent physiquement chez le fournisseur.

---

### Format Excel exact (colonnes attendues)

Le parser détecte les colonnes par leur nom d'en-tête (insensible à la casse, aux accents et aux espaces superflus).

| Colonne Excel | Obligatoire | Règle |
|---|---|---|
| `nom_produit` | Oui | Nom affiché dans le catalogue et la vitrine |
| `prix_vente` | Oui | Prix payé par le client final. Doit être numérique > 0 |
| `Commission` | Oui | Montant fixe de commission en devise locale. Numérique > 0 |
| `Pourcentage_commission` | Oui | Ex : `15` pour 15%. Numérique entre 0 et 100 |
| `quantite_stock` | Oui | Entier ≥ 0. Si 0 → produit retiré du catalogue automatiquement |
| `description` | Oui | Texte libre. Peut être long (multi-lignes Excel acceptées) |
| `caracteristique` | Non | Texte libre optionnel (matière, dimensions, couleurs…) |
| `categorie` | Non | Texte libre. Utilisé pour les filtres de la vitrine |
| `reference_interne` | Oui | Clé unique chez le fournisseur. Sert à la réconciliation update vs create |
| `url_image` | Oui | URL complète vers l'image du produit (https://…). Doit être accessible publiquement |

> **Règle critique sur `reference_interne`** : c'est la seule colonne qui permet de savoir si une ligne Excel correspond à un produit existant (update) ou à un nouveau produit (create). Sans elle, chaque upload recréerait tout. Le fournisseur ne doit jamais changer cette valeur une fois le produit créé.

> **Règle sur `url_image`** : la plateforme télécharge l'image depuis cette URL au moment de la sync, la réencode si nécessaire (WebP, max 1200px), et la met en cache sur le CDN. L'`image_url` originale est conservée en DB pour reférence. Si l'URL est inaccessible, le produit est créé sans image avec un warning dans le rapport.

---

### Logique complète du moteur de sync

```
ENTRÉE : fichier Excel uploadé ou diffs reçus de l'agent

ÉTAPE 0 — Parsing
  → Lire toutes les lignes de la première feuille (ou de la feuille nommée "Inventaire")
  → Normaliser les en-têtes (lowercase, trim, sans accents)
  → Valider chaque ligne avec le schéma zod

ÉTAPE 1 — Pour chaque ligne valide :

  Rechercher Product WHERE supplier_id = $jwt.userId AND reference_interne = $ligne.reference_interne

  [CAS A — Produit inexistant → CRÉATION]
    → Télécharger url_image → stocker sur CDN → obtenir image_cdn_url
    → INSERT Product {
        supplier_id, reference_interne, nom_produit, description,
        caracteristique, categorie, image_url, image_cdn_url,
        prix_vente, commission, pourcentage_commission,
        stock_quantity, is_active = (stock_quantity > 0),
        sync_source, last_synced_at = now()
      }
    → Compteur: created++

  [CAS B — Produit existant → MISE À JOUR]
    → Comparer chaque champ avec la valeur en DB
    → Si url_image a changé → re-télécharger → mettre à jour image_cdn_url
    → UPDATE tous les champs modifiés
    → stock_quantity = 0 → is_active = false
    → stock_quantity > 0 → is_active = true (réactivation automatique)
    → Compteur: updated++

ÉTAPE 2 — Produits absents du fichier
  → SELECT Products WHERE supplier_id = $userId AND reference_interne NOT IN ($listeRefs)
  → Pour chacun : is_active = false (jamais supprimer)
  → Compteur: deactivated++

ÉTAPE 3 — Nettoyage
  → fs.unlinkSync(filePath)  // supprimer le fichier du serveur IMMÉDIATEMENT

ÉTAPE 4 — Rapport
  → INSERT SyncReport { created, updated, deactivated, errors, synced_at }
  → Retourner le rapport au fournisseur
```

---

### Règles de validation par ligne (zod schema)

```typescript
const ExcelRowSchema = z.object({
  nom_produit:            z.string().min(2),
  prix_vente:             z.number().positive(),
  commission:             z.number().positive(),
  pourcentage_commission: z.number().min(0).max(100),
  quantite_stock:         z.number().int().min(0),
  description:            z.string().min(1),
  caracteristique:        z.string().optional(),
  categorie:              z.string().optional(),
  reference_interne:      z.string().min(1),
  url_image:              z.string().url(),
})

// Comportement si validation échoue :
// → SKIP la ligne
// → Ajouter { row: N, reference: X, reason: "..." } dans errors[]
// → NE PAS interrompre le traitement des autres lignes
```

---

### Gestion de l'image (pipeline)

```
url_image (Excel)
  → Vérification accessibilité (HEAD request, timeout 5s)
  → Si inaccessible → warning dans rapport, produit créé sans image
  → Si accessible :
      → Téléchargement (max 10MB)
      → Conversion WebP (sharp.js) + resize max 1200px
      → Upload sur Object Storage (MinIO / S3)
      → image_cdn_url = CDN_BASE_URL + /products/{supplier_id}/{reference_interne}.webp
      → Suppression du fichier temporaire local
```

---

### Endpoints

```
POST   /suppliers/inventory/upload
       Body  : multipart/form-data { file: .xlsx }
       Auth  : JWT (role: supplier)
       Action: parse → validate → sync → delete file → retourne SyncReport

GET    /suppliers/inventory/sync-report
       Retourne: { created, updated, deactivated, errors[], synced_at, source }

POST   /suppliers/inventory/agent-sync
       Body  : { diffs: [{ reference_interne, field, new_value }] }
       Auth  : JWT + api_key agent (révocable)
       Action: applique uniquement les diffs — même logique de stock/image
```

---

### Modèles de données mis à jour

```typescript
// Table: products
Product {
  id: uuid
  supplier_id: uuid             // FK → users

  reference_interne: string     // UNIQUE avec supplier_id
  nom_produit: string
  description: string
  caracteristique: string | null
  categorie: string | null

  image_url: string             // URL originale fournie dans l'Excel
  image_cdn_url: string | null  // URL CDN après traitement (WebP)

  prix_vente: decimal(10,2)
  commission: decimal(10,2)
  pourcentage_commission: decimal(5,2)
  // prix_gros = prix_vente - commission  (calculé, pas stocké)

  stock_quantity: integer       // CHECK stock_quantity >= 0
  is_active: boolean            // géré automatiquement par le moteur de sync

  last_synced_at: timestamp
  sync_source: 'excel_upload' | 'agent' | 'dashboard_manual'
  created_at: timestamp
  updated_at: timestamp

  // Index
  UNIQUE (supplier_id, reference_interne)
  INDEX  (is_active, categorie)
  INDEX  (supplier_id)
}

// Table: sync_reports
SyncReport {
  id: uuid
  supplier_id: uuid
  synced_at: timestamp
  source: 'excel_upload' | 'agent'
  products_created: integer
  products_updated: integer
  products_deactivated: integer
  errors: jsonb   // [{ row: 3, reference: 'REF-001', reason: 'url_image inaccessible' }]
}
```

---

### Sécurité et confidentialité

1. **Fichier supprimé après parsing** : `fs.unlinkSync()` immédiatement après traitement. Le fichier `.xlsx` ne persiste jamais sur le serveur.
2. **Images téléchargées en interne** : le serveur fait le fetch, jamais le navigateur du client. L'URL d'origine n'est pas exposée dans l'API publique (seule `image_cdn_url` est retournée).
3. **Isolation par supplier_id** : le RBAC middleware garantit qu'un fournisseur ne peut syncer que ses propres produits.
4. **Clé agent révocable** : chaque agent local reçoit une `api_key` indépendante révocable depuis le dashboard sans affecter le JWT principal.
5. **Rate limit upload** : max 5 uploads par heure par fournisseur pour éviter les abus.

---

### Stack technique pour ce module

```
Parsing Excel  : xlsx (SheetJS) — supporte .xls, .xlsx, .ods
Validation     : zod
Traitement img : sharp (resize + WebP)
Surveillance   : chokidar (agent local)
Packaging agent: pkg (Node.js → .exe sans prérequis)
Upload CDN     : aws-sdk ou minio-js
```

---

### Checklist d'implémentation (Phase 1)

- [ ] Schéma zod `ExcelRowSchema` avec toutes les colonnes
- [ ] Parser SheetJS : normalisation des en-têtes, extraction des lignes
- [ ] Pipeline image : fetch → sharp → upload CDN → image_cdn_url
- [ ] Moteur de sync : create / update / deactivate avec transaction PostgreSQL
- [ ] Suppression fichier après traitement
- [ ] Modèle `SyncReport` + endpoint GET rapport
- [ ] Endpoint `POST /suppliers/inventory/upload`
- [ ] UI dashboard fournisseur : zone de drop Excel + affichage rapport de sync
- [ ] Agent local — Mode B (Phase 2, optionnel pour MVP)

---

*Généré avec Claude · Architecture Social-Commerce as a Service*