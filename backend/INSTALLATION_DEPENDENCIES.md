# Dépendances à installer pour le module Sync Inventaire Excel

Pour que le module de synchronisation d'inventaire fonctionne, vous devez installer les dépendances supplémentaires suivantes :

## Installation des dépendances

```bash
npm install xlsx zod sharp
npm install --save-dev @types/multer
```

### Détail des packages :

- **xlsx** : Parser pour fichiers Excel (.xlsx, .xls)
  - Utilisé dans `inventory.service.ts` pour lire et parser les fichiers Excel
  - Version recommandée : ^0.18.5

- **zod** : Schema validation library
  - Utilisé dans `schemas.ts` pour valider les lignes du fichier Excel
  - Version recommandée : ^3.22.4

- **sharp** : Image processing library
  - Utilisé pour redimensionner et convertir les images en WebP
  - Sera utilisé dans `inventory.service.ts` pour le pipeline image CDN (Phase 2)
  - Version recommandée : ^0.33.1

- **@types/multer** : TypeScript types pour multer
  - Types pour le FileInterceptor de NestJS
  - Version recommandée : ^1.4.11

---

## Migration Prisma

Après avoir mis à jour le schéma Prisma (`prisma/schema.prisma`), exécutez :

```bash
npm run prisma:migrate
```

Cela créera les nouvelles tables :
- Modifications du modèle `Product` pour ajouter les champs Excel
- Nouveau modèle `SyncReport` pour tracer les synchronisations
- Nouvel énumération `SyncSource`

---

## Configuration de l'upload

Les fichiers uploadés sont stockés temporairement dans `uploads/excel/` avant traitement et suppression.
Cet dossier est créé automatiquement lors du premier upload si n'existe pas.

La taille maximale des fichiers est définie à 10MB dans le `FileInterceptor`.
