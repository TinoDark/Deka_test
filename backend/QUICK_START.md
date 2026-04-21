# Quick Start — Module Sync Inventaire Excel

Démarrage rapide pour utiliser le module de synchronisation d'inventaire Excel (Phase 1, 2, 3).

---

## ⚡ Installation rapide (5 minutes)

### 1. Copier `.env.example`

```bash
cd backend
cp .env.example .env
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Mettre à jour la base PostgreSQL

```bash
npm run prisma:migrate
```

### 4. Démarrer le stack avec docker-compose

```bash
# Depuis la racine du projet
docker-compose up

# Ou en arrière-plan
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

Services lancés :
- PostgreSQL : `localhost:5432`
- Redis : `localhost:6379`
- MinIO : `localhost:9000` (API) et `localhost:9001` (Console)
- Backend NestJS : `localhost:3000`

### 5. Créer le bucket MinIO

```bash
# Option A : via CLI
docker exec dekora-minio mc mb /minio_data/dekora-products

# Option B : via web console
# http://localhost:9001
# Login : minioadmin / minioadmin
# Créer bucket "dekora-products"
```

---

## Tester les endpoints

### A. Générer un JWT (fournisseur)

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supplier@example.com",
    "password": "password123"
  }'

# Réponse
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "user": {
    "id": "uuid-here",
    "role": "SUPPLIER"
  }
}

# Exporter le JWT
export JWT="eyJhbGc..."
```

### B. Upload un fichier Excel

Créer un fichier `inventory.xlsx` avec les colonnes :

| nom_produit | prix_vente | commission | pourcentage_commission | quantite_stock | description | reference_interne | url_image | categorie | caracteristique |
|---|---|---|---|---|---|---|---|---|---|
| Produit A | 50 | 10 | 20 | 100 | Description produit A | REF-001 | https://example.com/image1.jpg | Électronique | Blanc, 256GB |
| Produit B | 30 | 5 | 16.67 | 0 | Description produit B | REF-002 | https://example.com/image2.jpg | Vêtements | Taille M |

```bash
curl -X POST http://localhost:3000/suppliers/inventory/upload \
  -H "Authorization: Bearer $JWT" \
  -F "file=@./inventory.xlsx"
```

**Réponse attendue** :
```json
{
  "id": "uuid",
  "supplierId": "uuid",
  "syncedAt": "2026-03-26T10:30:00Z",
  "source": "EXCEL_UPLOAD",
  "productsCreated": 2,
  "productsUpdated": 0,
  "productsDeactivated": 0,
  "errors": []
}
```

### C. Récupérer le rapport

```bash
curl -X GET http://localhost:3000/suppliers/inventory/sync-report \
  -H "Authorization: Bearer $JWT"
```

### D. Sync diffs (Mode Agent)

```bash
curl -X POST http://localhost:3000/suppliers/inventory/agent-sync \
  -H "Authorization: Bearer $JWT" \
  -H "X-Agent-Key: test-agent-key" \
  -H "Content-Type: application/json" \
  -d '{
    "diffs": [
      {
        "reference_interne": "REF-001",
        "field": "quantite_stock",
        "new_value": 50
      },
      {
        "reference_interne": "REF-002",
        "field": "is_active",
        "new_value": false
      }
    ]
  }'
```

---

## Vérifier les résultats

### A. Consulter MinIO

Console web : http://localhost:9001
- Images uploadées : `dekora-products → products → {supplier_id} → *.webp`

### B. Interroger la BD PostgreSQL

```bash
# Se connecter à PostgreSQL
docker exec -it dekora-postgres psql -U dekora -d dekora_social_commerce

# Lister les produits
SELECT reference_interne, nom_produit, prix_vente, commission, stock_quantity, is_active, image_cdn_url 
FROM "Product" 
WHERE supplier_id = '...';

# Lister les rapports de sync
SELECT * FROM "SyncReport" 
ORDER BY synced_at DESC 
LIMIT 5;
```

### C. Consulter les logs NestJS

```bash
docker logs -f dekora-backend
```

---

## Dépannage

### MinIO bucket não existe

```bash
# Recréer le bucket
docker exec dekora-minio mc mb /minio_data/dekora-products
```

### MINIO_ENDPOINT "Cannot connect"

```bash
# Vérifier que le service MinIO est lancé
docker ps | grep minio

# Redémarrer MinIO
docker-compose restart minio
```

### JWT invalid

- Vérifier que `JWT_SECRET` dans `.env` correspond entre auth et app
- Commander un nouveau token via `/auth/login`

### PostgreSQL connection refused

```bash
# Redémarrer PostgreSQL
docker-compose restart postgres

# Migrer de nouveau
npm run prisma:migrate
```

---

## Cas d'usage complète

### Workflow 1 : Upload initial

1. Fournisseur crée un Excel avec ses produits
2. Fournisseur login via `/auth/login`
3. Fournisseur upload le fichier via `/suppliers/inventory/upload`
4. Serveur :
   - Parse le fichier
   - Crée les produits
   - Télécharge les images
   - Les convertit en WebP
   - Les upload sur MinIO
   - Supprime le fichier Excel
5. Fournisseur reçoit un rapport avec résumé

### Workflow 2 : Mise à jour de stock

Fournisseur a installé l'agent local qui surveille son Excel :

1. Agent détecte changement de stock (quantite_stock passe de 100 à 50)
2. Agent envoie un diff via `/suppliers/inventory/agent-sync`
3. Serveur met à jour `stockQuantity = 50`
4. Agent reçoit confirmation

### Workflow 3 : Image inaccessible

1. Excel avec URL image qui n'existe plus
2. Serveur contacte l'URL : timeout ou 404
3. Produit créé SANS image (warning dans rapport)
4. Fournisseur peut retoucher l'URL et relancer sync

---

## 📚 Fichiers de configuration

### `.env` (vos secrets)

```bash
# Production : À changer !
DATABASE_URL="postgresql://dekora:password123@localhost:5432/dekora_social_commerce"
JWT_SECRET="your-secret-key-here"
STORAGE_BACKEND="minio"
# ... voir .env.example pour tous les paramètres
```

### `docker-compose.yml`

Déjà configuré avec :
- PostgreSQL 15
- Redis 7
- MinIO
- Backend NestJS

Éditer si besoin de changer les ports ou credentials.

### `schema.prisma`

Modèles :
- `Product` — Articles avec tous les champs Excel
- `SyncReport` — Historique des synchronisations
- `User` — Fournisseurs, revendeurs, livreurs

---

## ✅ Checklist avant production

- [ ] `JWT_SECRET` changé et robuste
- [ ] `DATABASE_URL` pointe vers basede données sécurisée
- [ ] MinIO accès HTTPS (via proxy ou CDN)
- [ ] Credentials MinIO changés (ne pas utiliser minioadmin)
- [ ] Quotas MinIO configurés
- [ ] Backup PostgreSQL et MinIO planifiés
- [ ] Rate limiting activé
- [ ] Monitoring Sentry/Grafana en place
- [ ] CORS configuré (frontend)
- [ ] Zone de stockage temporaire nettoyée régulièrement

---

## 📖 Documentation complète

- [CLAUDE.md](../CLAUDE.md) — Section 12 pour l'architecture
- [backend/src/suppliers/README.md](backend/src/suppliers/README.md) — Détails du module
- [backend/PHASE_2_3_SUMMARY.md](backend/PHASE_2_3_SUMMARY.md) — Récapitulatif
- [backend/.env.example](backend/.env.example) — Tous les paramètres

---

## 💡 Tips

- **PgAdmin** : Pour naviguer PostgreSQL plus facilement
  ```bash
  # Ajouter à docker-compose.yml
  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
  ```

- **Swagger/OpenAPI** : Pour documenter les endpoints
  ```bash
  npm install @nestjs/swagger swagger-ui-express
  # Puis générer le Swagger dans main.ts
  ```

- **Observabilité** : Terminal avec logs multiplex
  ```bash
  docker-compose logs -f backend postgres redis minio
  ```

---

**Status** : ✅ Prêt pour développement et tests
**Problèmes ?** Voir dépannage ci-dessus ou ouvrir une issue
