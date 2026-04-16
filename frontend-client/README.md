# DEKA Frontend Client

Cette application est le frontend public de la vitrine client DEKA. Elle est indépendante du dossier `frontend-web`, qui conserve les fonctionnalités dashboard existantes pour les fournisseurs, revendeurs et administrateurs.

## Objectifs
- exécuter une vitrine publique sur un domaine séparé
- consommer le même backend via `NEXT_PUBLIC_API_URL`
- isoler le flux client du reste de l’application frontend

## Structure
- `app/` : pages Next.js App Router
- `components/` : composants visibles côté client
- `lib/api.ts` : helpers de requêtes vers le backend
- `lib/cartStore.ts` : store Zustand pour le panier

## Déploiement
### Local
```bash
cd frontend-client
npm install
npm run dev
```

### Docker
```bash
docker build -t deka-frontend-client ./frontend-client
docker run -p 3001:3000 -e NEXT_PUBLIC_API_URL=http://localhost:3000 deka-frontend-client
```

### docker-compose
Le service `frontend-client` dans `docker-compose.yml` a été mis à jour pour construire depuis `./frontend-client`.

## Variables d’environnement
- `NEXT_PUBLIC_API_URL` : URL du backend principal
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` : clé API Google Maps pour la sélection d’adresse
