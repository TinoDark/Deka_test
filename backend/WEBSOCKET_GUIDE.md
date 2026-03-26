# 🔔 WebSocket Notifications — Guide d'utilisation

## 📡 Vue d'ensemble

Le système de notifications WebSocket permet une communication temps réel entre le serveur et les clients :

- **Fournisseurs** : Notifications de syncs Excel (upload, agent)
- **Admins** : Notifications de tout événement (syncs, livraisons, modération)
- **Livreurs** : Mises à jour de statut de colis
- **Revendeurs** : Statuts de commandes

---

## 🔌 Configuration côté serveur

### 1. Module WebSocket enregistré
```typescript
// app.module.ts
import { WebSocketModule } from './common/websocket/websocket.module';

@Module({
  imports: [
    // ...
    WebSocketModule,  // ✓ WebSocket activé
  ],
})
export class AppModule {}
```

### 2. Gateway disponible
```typescript
// common/websocket/notifications.gateway.ts
@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: '*', credentials: true },
})
export class NotificationsGateway { ... }
```

---

## 💻 Utilisation côté client

### Installation

```bash
npm install socket.io-client
```

### Connexion basique

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Authentifier l'utilisateur
socket.emit('auth', {
  userId: 'user-123',    // Votre ID utilisateur
  token: jwtToken,       // JWT du localStorage
});

// Écouter la confirmation d'authentification
socket.on('auth_success', (data) => {
  console.log('✓ Authenticated:', data);
});

socket.on('auth_error', (data) => {
  console.error('✗ Auth failed:', data);
});
```

---

## 🎯 Événements disponibles

### Pour les fournisseurs

#### S'abonner aux syncs
```typescript
// Le fournisseur reçoit les mises à jour de ses syncs uniquement
socket.emit('subscribe', { room: `supplier-syncs-${supplierId}` });

// Événements reçus
socket.on('sync_started', (data) => {
  console.log('✓ Sync started:', data);
  // { syncId, fileName, timestamp }
});

socket.on('sync_completed', (report) => {
  console.log('✓ Sync completed:', report);
  // { id, productsCreated, productsUpdated, errors[], timestamp }
});

socket.on('sync_failed', (error) => {
  console.error('✗ Sync failed:', error);
  // { error: string, timestamp }
});
```

### Pour les admins

#### S'abonner aux syncs admin
```typescript
socket.emit('subscribe', { room: 'admin-syncs' });

// Reçoit TOUS les syncs de tous les fournisseurs
socket.on('sync_completed', (report) => {
  console.log('Admin notified:', report);
  // { id, supplierId, productsCreated, ..., timestamp }
});
```

#### S'abonner aux logistiques
```typescript
socket.emit('subscribe', { room: 'admin-logistics' });

socket.on('package_status_updated', (data) => {
  console.log('Package updated:', data);
  // { packageCode, status, timestamp }
});
```

#### S'abonner au panel admin
```typescript
socket.emit('subscribe', { room: 'admin-panel' });

socket.on('notification', (data) => {
  console.log('Admin notification:', data);
  // { type: 'sync|delivery|kyc|...' , data, timestamp }
});
```

### Pour les livreurs

#### S'abonner au suivi d'un colis
```typescript
socket.emit('subscribe', { room: `package-AAMMJJ-XXXX` });

socket.on('package_status_updated', (data) => {
  console.log('Package status:', data);
  // { packageCode: 'AAMMJJ-XXXX', status, timestamp }
});
```

---

## 🔔 Émettre des événements depuis le serveur

Le Gateway WebSocket expose des méthodes pour notifier les clients :

```typescript
// Dans n'importe quel service
constructor(private notificationsGateway: NotificationsGateway) {}

// Notifier un fournisseur de son sync
this.notificationsGateway.emitSyncCompleted(supplierId, {
  id: sync.id,
  productsCreated: 10,
  productsUpdated: 5,
  productsDeactivated: 0,
  errors: [],
});

// Notifier les admins
this.notificationsGateway.emitAdminNotification('sync_completed', {
  supplierId,
  supplierEmail,
  productsCreated: 10,
});

// Notifier un utilisateur "offline-safe"
this.notificationsGateway.emitUserNotification(userId, 'payout_completed', {
  amount: 50000,
  provider: 'mix_by_yas',
});

// Notifier un update de colis à tous
this.notificationsGateway.emitPackageStatusUpdate('AAMMJJ-XXXX', 'DELIVERED');
```

---

## 📦 Intégration avec le service Inventory (Sync Excel)

Lors d'un upload Excel, le gateway est appelé :

```typescript
// inventory.service.ts
constructor(
  private prisma: PrismaService,
  private notificationsGateway: NotificationsGateway,
  private imageProcessor: ImageProcessorService,
  private storage: StorageService,
) {}

async uploadAndSyncInventory(file: Express.Multer.File, userId: string) {
  try {
    // Notifier demande de sync en cours
    this.notificationsGateway.emitSyncStarted(userId, {
      fileName: file.originalname,
      fileSize: file.size,
    });

    // ... traiter le fichier ...

    // Notifier sync complété
    this.notificationsGateway.emitSyncCompleted(userId, report);
  } catch (error) {
    // Notifier erreur
    this.notificationsGateway.emitSyncFailed(userId, error.message);
  }
}
```

---

## 🛠️ Example React / Next.js Client

```typescript
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSyncNotifications(supplierId: string) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [report, setReport] = useState(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connecter
    const newSocket = io('http://localhost:3000/notifications', {
      reconnection: true,
    });

    // Authentifier
    newSocket.emit('auth', {
      userId: supplierId,
      token: localStorage.getItem('token'),
    });

    // S'abonner aux syncs du fournisseur
    newSocket.on('auth_success', () => {
      newSocket.emit('subscribe', {
        room: `supplier-syncs-${supplierId}`,
      });
    });

    // Écouter les événements
    newSocket.on('sync_started', () => {
      setStatus('syncing');
    });

    newSocket.on('sync_completed', (completedReport) => {
      setReport(completedReport);
      setStatus('done');
    });

    newSocket.on('sync_failed', (error) => {
      console.error('Sync failed:', error);
      setStatus('error');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [supplierId]);

  return { status, report };
}

// Utilisation dans un composant
export function SyncUploadComponent() {
  const { status, report } = useSyncNotifications(userId);

  return (
    <div>
      {status === 'syncing' && <p>⏳ Synchronisation en cours...</p>}
      {status === 'done' && <p>✓ Sync complété: {report.productsCreated} produits</p>}
      {status === 'error' && <p>✗ Erreur de sync</p>}
    </div>
  );
}
```

---

## ✅ Checklist d'implémentation

- [x] Gateway WebSocket créé (`notifications.gateway.ts`)
- [x] Module WebSocket enregistré
- [x] Méthodes d'émission implémentées
- [x] Authentification OAuth par JWT
- [x] Namespace `notifications`
- [x] Rooms pour isolation utilisateur
- [ ] **TODO**: Intégrer dans services (Inventory, Logistics, etc.)
- [ ] **TODO**: Client React example complet
- [ ] **TODO**: Mobile app synchronization

---

## 🚀 Déploiement

En production, assurez-vous que :

1. **CORS configuré** : Spécifier les domaines allowés
   ```typescript
   @WebSocketGateway({
     cors: {
       origin: ['https://app.deka.com', 'https://admin.deka.com'],
     },
   })
   ```

2. **Redis Adapter** (pour multi-serveurs) :
   ```typescript
   import { createAdapter } from '@socket.io/redis-adapter';
   io.adapter(createAdapter(pubClient, subClient));
   ```

3. **Load Balancer** : WebSocket nécessite "sticky sessions"

---

## 📚 Ressources

- [Socket.io Documentation](https://socket.io/docs/)
- [NestJS WebSockets](https://docs.nestjs.com/gateways)
- [Client-side Examples](https://socket.io/docs/v4/client-api/)

---

*Généré pour Deka Social-Commerce Platform*
