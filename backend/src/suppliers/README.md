# Module Suppliers - Synchronisation d'Inventaire Excel

Ce module implémente la section 12 du `CLAUDE.md` : "MODULE SYNC INVENTAIRE EXCEL (Fournisseur)"

## Architecture

```
src/suppliers/
├── suppliers.module.ts           # Module principal
└── inventory/
    ├── inventory.controller.ts    # Endpoints HTTP
    ├── inventory.service.ts       # Logique métier de sync
    └── schemas.ts                 # Schémas de validation (zod)
```

# Module Suppliers - Synchronisation d'Inventaire Excel

Ce module implémente la section 12 du `CLAUDE.md` : "MODULE SYNC INVENTAIRE EXCEL (Fournisseur)"

## Architecture

```
src/suppliers/
├── suppliers.module.ts              # Module principal (Phase 1)
└── inventory/
    ├── inventory.controller.ts       # Endpoints HTTP (Phase 1 + 3)
    ├── inventory.service.ts          # Logique métier de sync (Phase 1 + 3)
    ├── schemas.ts                    # Schémas de validation (Phase 1)
    ├── image-processor.service.ts    # Traitement d'images (Phase 2)
    └── storage.service.ts            # Client MinIO/S3 (Phase 2)
```

## Phases implémentées

### Phase 1 ✅ — Mode A : Upload Manuel Excel
- Parser Excel avec normalisation des en-têtes
- Validation des lignes (zod)
- Création/mise à jour/désactivation automatique des produits
- Gestion des erreurs par ligne
- Suppression du fichier après traitement

### Phase 2 ✅ — Pipeline d'images CDN
- Téléchargement des images depuis l'URL
- Vérification d'accessibilité (HEAD request)
- Redimensionnement à 1200px max
- Conversion en WebP
- Upload sur MinIO ou AWS S3
- URL CDN mise en cache dans la BD

### Phase 3 ✅ — Mode B : Agent Local
- Endpoint `/suppliers/inventory/agent-sync` pour les diffs
- Synchronisation incrémentale (uniquement les changements)
- Support des clés API agent (révocables)
- Traitement d'images lors du changement d'URL

---

## 1. Upload manuel de fichier Excel (Mode A)

**Endpoint** : `POST /suppliers/inventory/upload`

Le fournisseur upload son fichier `.xlsx` depuis le dashboard. Le serveur :
1. Parse le fichier
2. Valide chaque ligne
3. Crée ou met à jour les produits
4. Traite les images (télécharge, redimensionne, upload CDN)
5. Supprime le fichier du serveur

**Authentification** : JWT (role: SUPPLIER)

**Body** : Multipart form avec champ `file`

**Réponse** : 
```json
{
  "id": "uuid",
  "supplierId": "uuid",
  "syncedAt": "2026-03-26T10:30:00Z",
  "source": "EXCEL_UPLOAD",
  "productsCreated": 5,
  "productsUpdated": 3,
  "productsDeactivated": 1,
  "errors": [
    {
      "row": 2,
      "reference": "REF-001",
      "reason": "url_image inaccessible"
    }
  ]
}
```

### Format du fichier Excel

**Colonnes obligatoires** :

| Colonne | Type | Description |
|---------|------|-------------|
| `nom_produit` | String | Nom affiché dans le catalogue |
| `prix_vente` | Number | Prix payé par le client final (> 0) |
| `commission` | Number | Montant fixe de commission en devise locale (> 0) |
| `pourcentage_commission` | Number | Pourcentage (0-100). Ex: 15 pour 15% |
| `quantite_stock` | Integer | Quantité en stock (≥ 0). Si 0 → produit retiré |
| `description` | String | Texte libre (min 1 caractère) |
| `reference_interne` | String | Clé UNIQUE du fournisseur (pour update vs create) |
| `url_image` | String | URL publique de l'image (https://...) |

**Colonnes optionnelles** :

| Colonne | Type | Description |
|---------|------|-------------|
| `caracteristique` | String | Matière, dimensions, couleurs, etc. |
| `categorie` | String | Utilisé pour les filtres de la vitrine |

### Règles de validation

- **reference_interne** : UNIQUE par fournisseur. Ne pas modifier une fois créée.
- **url_image** : Doit être accessible publiquement (vérification HEAD request, timeout 5s)
- **prix_vente** et **commission** : Doivent être positifs
- **quantite_stock** : Entier positif. Si 0 → `isActive = false` automatiquement
- Les lignes valides qui ne peuvent pas être traitées (ex: image inaccessible) deviennent warnings dans le rapport

---

## 2. Pipeline de traitement d'images CDN (Phase 2)

### Architecture

```
ImageProcessorService
├── Vérifier accessibilité (HEAD request)
├── Télécharger l'image (max 10MB)
├── Analyser metadata (détection format invalide)
├── Redimensionner (max 1200px)
├── Convertir en WebP
└── Upload sur StorageService

StorageService (abstraction)
├── MinIO (self-hosted)
│  ├── Endpoint, port, credentials
│  └── Retourner URL CDN
└── AWS S3 / CloudFront
    ├── Access key, secret key
    └── Retourner URL S3 ou CloudFront
```

### Configuration

Configurer l'une des deux options dans `.env` :

**MinIO (développement local)** :
```env
STORAGE_BACKEND=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
STORAGE_BUCKET=deka-products
CDN_BASE_URL=http://localhost:9000
```

**AWS S3** :
```env
STORAGE_BACKEND=s3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
STORAGE_BUCKET=deka-products
CDN_BASE_URL=https://your-cloudfront-domain.cloudfront.net
```

### Utilisation

Lors du sync Excel, l'image est automatiquement traitée si l'URL est accessible.

L'image CDN est mise à jour automatiquement si :
- Création d'un nouveau produit
- Mise à jour d'un produit existant avec URL d'image différente
- Endpoint agent-sync avec changement d'URL

### Performances

- Timeout d'accessibilité : 5 secondes (HEAD request)
- Taille max téléchargement : 10 MB
- Redimensionnement max : 1200px (dimensions préservées)
- Format : WebP qualité 80%
- Cache-Control : 1 an (immutable)

---

## 3. Mode Agent Local (Phase 3)

**Endpoint** : `POST /suppliers/inventory/agent-sync`

Pour les fournisseurs avancés, un agent local peut synchroniser uniquement les diffs au lieu de reuploading le fichier entier.

### Utilisation

**Body** :
```json
{
  "diffs": [
    {
      "reference_interne": "REF-001",
      "field": "quantite_stock",
      "new_value": 42
    },
    {
      "reference_interne": "REF-002",
      "field": "url_image",
      "new_value": "https://example.com/new-image.jpg"
    }
  ]
}
```

**Headers** :
```
Authorization: Bearer <JWT_TOKEN>
X-Agent-Key: <AGENT_API_KEY>
```

**Réponse** : Même format que le sync Excel

### Champs autorisés pour agent-sync

- `quantite_stock` (auto-réactive si > 0)
- `prix_vente`
- `commission`
- `pourcentage_commission`
- `nom_produit`
- `description`
- `caracteristique`
- `categorie`
- `url_image` (traite l'image automatiquement)
- `is_active`

### Gestion des clés API agent (TODO)

À implémenter :
- Endpoint `POST /suppliers/inventory/agent-keys` pour générer une clé
- Endpoint `DELETE /suppliers/inventory/agent-keys/:keyId` pour révoquer
- Stockage des clés avec hachage + rotation

---

## Logique de synchronisation (complète)

### ÉTAPE 0 — Parsing Excel
- Lit la première feuille ou celle nommée "Inventaire"
- Normalise les en-têtes : lowercase, trim, sans accents
- Valide avec le schéma zod
- Retient les erreurs sans interrompre le traitement

### ÉTAPE 1 — Pour chaque ligne valide

**CAS A — Produit inexistant** : CRÉATION
```typescript
Product.create({
  supplierId,
  referenceInterne,
  nomProduit,
  ...
  imageUrl,         // URL originale
  imageCdnUrl: null,
  syncSource: 'EXCEL_UPLOAD'
})

// Puis traitement d'image de manière asynchrone
const cdnUrl = await ImageProcessor.process(imageUrl, ...)
Product.update({ imageCdnUrl: cdnUrl })
```

**CAS B — Produit existant** : MISE À JOUR
- Vérifie les changements champ par champ
- Réactive automatiquement si `stockQuantity > 0`
- Marque `isActive = false` si `stockQuantity = 0`
- Traite la nouvelle image si l'URL a changé

### ÉTAPE 2 — Produits absents du fichier
- Récupère tous les produits du fournisseur absents du fichier
- Marque `isActive = false` (jamais de suppression, conservation de l'historique)

### ÉTAPE 3 — Nettoyage
- Supprime le fichier Excel du serveur IMMÉDIATEMENT après traitement

### ÉTAPE 4 — Rapport
- Insère un enregistrement `SyncReport` avec résumé
- Retourne le rapport au client

---

## Modèles de données

### Product (mis à jour)

```typescript
model Product {
  id                    String       @id @default(uuid())
  supplierId            String       // FK → User
  
  referenceInterne      String       // UNIQUE avec supplierId
  nomProduit            String
  description           String
  caracteristique       String?
  categorie             String?
  
  imageUrl              String       // URL originale (Excel)
  imageCdnUrl           String?      // URL CDN (local board de traitement)
  
  prixVente             Decimal      // Prix client final
  commission            Decimal      // Montant fixe
  pourcentageCommission Decimal      // %
  
  stockQuantity         Int
  isActive              Boolean
  
  lastSyncedAt          DateTime?
  syncSource            SyncSource   // EXCEL_UPLOAD | AGENT | DASHBOARD_MANUAL
  
  createdAt             DateTime
  updatedAt             DateTime
}
```

### SyncReport (nouveau)

```typescript
model SyncReport {
  id                  String       @id @default(uuid())
  supplierId          String       // FK → User
  syncedAt            DateTime
  source              SyncSource   // EXCEL_UPLOAD | AGENT | DASHBOARD_MANUAL
  productsCreated     Int
  productsUpdated     Int
  productsDeactivated Int
  errors              String       // JSON
  createdAt           DateTime
}
```

---

## Gestion des erreurs

Lors du parsing/traitement, les erreurs sont ajoutées au rapport sans interrompre le processus :

```json
{
  "row": 2,
  "reference": "REF-001",
  "reason": "url_image inaccessible"
}
```

Types d'erreurs :
- Erreurs de validation zod (schéma)
- Erreurs de téléchargement d'image
- Erreurs d'upload CDN
- Erreurs de mise à jour DB

---

## Installation et configuration

### 1. Installer les dépendances

Les packages requis ont été ajoutés au `package.json` :
- `xlsx` : Parser Excel
- `zod` : Validation
- `sharp` : Traitement d'images
- `minio` : Client MinIO
- `@aws-sdk/client-s3` : Client AWS S3

```bash
npm install
```

### 2. Configuration base de données

```bash
npm run prisma:migrate
```

Cela crée les nouvelles tables/champs :
- Mise à jour du modèle `Product`
- Nouveau modèle `SyncReport`
- Nouvel énumération `SyncSource`

### 3. Lancer MinIO (développement)

```bash
# Déjà dans docker-compose.yml
docker-compose up minio

# Accès console : http://localhost:9001
# Credentials : minioadmin / minioadmin
```

### 4. Créer le bucket MinIO

```bash
docker exec deka-minio mc mb /minio_data/deka-products
```

---

## Tests recommandés

- [ ] Upload fichier Excel valide
- [ ] Upload fichier avec colonnes manquantes
- [ ] Upload fichier avec données invalides
- [ ] Vérifier réactivation automatique (`stock > 0`)
- [ ] Vérifier désactivation automatique (`stock = 0`)
- [ ] Vérifier que les anciens produits sont désactivés
- [ ] Vérifier que le fichier est supprimé après traitement
- [ ] Vérifier le traitement d'images (téléchargement, redimensionnement, upload CDN)
- [ ] Vérifier que imageCdnUrl est peuplée correctement
- [ ] Vérifier l'isolation par `supplierId`
- [ ] Vérifier l'endpoint agent-sync avec diffs
- [ ] Vérifier la réactivation au-travers agent-sync

---

## Documentation API complète

Voir `CLAUDE.md` section 12 pour les détails complets et les design decisions.

