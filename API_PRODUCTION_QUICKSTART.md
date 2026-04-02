# Quick Start: Valeurs API Production vs Développement

## 📋 Résumé Rapide

| Env | Où gérer? | Exemples | Risque |
|-----|-----------|----------|--------|
| **DEV** | `.env.local` (local) | `localhost:3000` | Bas |
| **PROD** | Railway Console | `https://api.deka.app` | Critique |

---

## 🚀 Déploiement Production: 3 Étapes

### Étape 1: Railway Console (5 min)

```
1. Accédez: https://railway.app
2. Projet → Variables
3. Ajouter chaque variable:
```

| Variable | Valeur Production |
|----------|------------------|
| `DATABASE_URL` | `postgresql://user:****@host/deka` |
| `JWT_SECRET` | `7f3e9c2a1b4d8f...` (32+ chars) |
| `GOOGLE_MAPS_API_KEY` | Clé production avec restrictions domaine |
| `PAYGATEGLOBAL_API_KEY` | Clé production du partenaire |
| `NODE_ENV` | `production` |
| `API_URL` | `https://api.deka.app` |
| `ADMIN_PASSWORD` | Mot de passe strong |

### Étape 2: Générer JWT_SECRET

Exécutez une fois localement:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copez le résultat → Railway Console → `JWT_SECRET`

### Étape 3: Push et Déployer

```bash
git push origin main
# Railway déploie automatiquement avec les variables
```

---

## 🔐 Sécurité Secrets en Production

### ✅ What NOT to do:
```bash
# ❌ JAMAIS coder des secrets:
const API_KEY = "AIzaSyBu-_37ha7_gG9RvCKSJW6cqObvnWWBkE";

# ❌ JAMAIS commit .env.production
git add .env.production  # MAUVAIS!

# ❌ JAMAIS partager passwords par email/chat
```

### ✅ What TO do:
```bash
# ✅ Utiliser environment variables:
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

# ✅ .env.local JAMAIS commité (listée dans .gitignore)
.env.local
.env.*.local

# ✅ Partager via Railway Console seulement
```

---

## 🎯 Google Maps en Production

Une fois clé obtenue:

**Google Cloud Console**:
1. APIs → Credentials
2. Cliquez sur la clé
3. Application restrictions → HTTP referrers
4. Ajouter domaines:
   - `*.deka.app`
   - `deka.app`
   - `www.deka.app`

**Résultat**: Clé fonctionnera UNIQUEMENT sur votre domaine.

---

## 💾 Fichiers à NE PAS Commiter

```bash
# .gitignore
.env.local
.env.production
.env.production.local
.env.*.local
.DS_Store
node_modules/
dist/
.next/
```

---

## 🔄 Exemple Complet: Dev → Prod

### Local (DEV)
```bash
# frontend-web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBu-_37ha7_gG9RvCKSJW6cqObvnWWBkE

# backend/.env
DATABASE_URL=postgresql://localhost:5432/deka_dev
JWT_SECRET=deka-dev-secret
NODE_ENV=development
```

**Lancer**:
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2  
cd frontend-web && npm run dev

# Accès: http://localhost:3001
```

### Production (PROD)
```bash
# Railway Console Variables (UI):
DATABASE_URL=postgresql://prod-user:****@railway-db:5432/deka_prod
JWT_SECRET=a7f3e9c2a1b4d8f6e5a9c2b1d4e7f8a9...
GOOGLE_MAPS_API_KEY=AIzaSyBu-prod-key-restricted...
NODE_ENV=production
API_URL=https://api.deka.app

# Frontend (Vercel ou Railway):
NEXT_PUBLIC_API_URL=https://api.deka.app
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBu-prod-key...
```

**Déployer**:
```bash
git push origin main
# Railway auto-déploie avec les variables
# ~3 minutes et c'est live!
```

---

## ⚡ Checklist Final Avant Déploiement

- [ ] JWT_SECRET généré (32+ chars random)
- [ ] DATABASE_URL configuré Railway
- [ ] Google Maps clé avec domaine restrictions
- [ ] .env.local / .env.production JAMAIS commités
- [ ] .gitignore contient `.env.*.local`
- [ ] NODE_ENV=production en Railway
- [ ] ADMIN_PASSWORD changé (pas admin123)
- [ ] API_URL pointeur bon domaine (https://api.deka.app)
- [ ] Tous les secrets dans Railway Console
- [ ] `git push` → Railway déploie automatiquement

---

## 🆘 Dépannage

### "API_KEY undefined" en production
❌ Variable manquante dans Railway Console  
✅ Ajouter dans Variables section

### "Cannot connect to DB"
❌ DATABASE_URL incorrect  
✅ Copier depuis Railway → PostgreSQL plugin

### "Maps not loading"
❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY absent  
✅ Ajouter avec domaine restrictions

### "JWT not recognized"
❌ JWT_SECRET différent dev/prod  
✅ Régénérer et mettre à même valeur partout

---

## Des Questions? 

Besoin d'aide pour:
- [ ] Générer un secret?
- [ ] Configurer Railway?
- [ ] Activer Google Maps restrictions?
- [ ] Autre?

**Répondez à cette question et je guide!** 🚀
