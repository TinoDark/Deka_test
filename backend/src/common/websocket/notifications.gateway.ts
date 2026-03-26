import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

/**
 * WebSocket Gateway pour notifications temps réel
 * - Événements de sync (Excel upload, Agent diffs)
 * - Statuts de livraison
 * - Notifications fournisseur
 */
@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Set<string>> = new Map(); // userId -> Set<socketIds>
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  afterInit(server: Server) {
    this.logger.log('WebSocket notifications initialized');
  }

  handleConnection(socket: Socket) {
    this.logger.debug(`Client attempting connection: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    const userId = this.socketToUser.get(socket.id);
    if (userId) {
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(userId);
        }
      }
      this.socketToUser.delete(socket.id);
      this.logger.debug(`User ${userId} disconnected - remaining sockets: ${userSockets?.size || 0}`);
    }
  }

  /**
   * Authentifier l'utilisateur et lier le socket à un userId
   */
  @SubscribeMessage('auth')
  handleAuth(
    @ConnectedSocket() socket: Socket,
    data: { userId: string; token: string },
  ): boolean {
    try {
      // TODO: Valider le JWT dans les données
      const { userId } = data;

      if (!userId) {
        socket.emit('auth_error', { message: 'Invalid userId' });
        return false;
      }

      // Associer socket -> userId
      this.socketToUser.set(socket.id, userId);

      // Ajouter socket aux clients connectés de cet utilisateur
      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      this.connectedClients.get(userId)!.add(socket.id);

      socket.emit('auth_success', { message: `Authenticated as ${userId}` });
      this.logger.debug(`User ${userId} authenticated - total sockets: ${this.connectedClients.get(userId)!.size}`);

      return true;
    } catch (error) {
      this.logger.error('Auth error:', error);
      socket.emit('auth_error', { error: error.message });
      return false;
    }
  }

  /**
   * Rejoindre une room (ex: supplier-syncs, deliveries, admin-panel)
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() socket: Socket,
    data: { room: string },
  ): void {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { room } = data;
    socket.join(room);
    this.logger.debug(`User ${userId} subscribed to room: ${room}`);
  }

  /**
   * Quitter une room
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() socket: Socket,
    data: { room: string },
  ): void {
    const { room } = data;
    socket.leave(room);
  }

  /**
   * Ping/Pong pour keep-alive
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: Socket): void {
    socket.emit('pong', { timestamp: Date.now() });
  }

  /**
   * Émettre un événement de SYNC_STARTED aux fournisseurs
   * Appelé par le service d'upload Excel
   */
  emitSyncStarted(supplierId: string, syncData: any): void {
    this.logger.debug(`Emitting sync started for supplier ${supplierId}`);
    this.server.to(`supplier-syncs-${supplierId}`).emit('sync_started', syncData);
  }

  /**
   * Émettre un événement de SYNC_COMPLETED aux fournisseurs + admins
   */
  emitSyncCompleted(supplierId: string, report: any): void {
    this.logger.debug(`Emitting sync completed for supplier ${supplierId}`);

    // Notifier le fournisseur
    this.server.to(`supplier-syncs-${supplierId}`).emit('sync_completed', {
      ...report,
      timestamp: Date.now(),
    });

    // Notifier les admins
    this.server.to('admin-syncs').emit('sync_completed', {
      ...report,
      timestamp: Date.now(),
    });
  }

  /**
   * Émettre un événement de SYNC_FAILED
   */
  emitSyncFailed(supplierId: string, error: string): void {
    this.logger.error(`Sync failed for supplier ${supplierId}: ${error}`);

    this.server.to(`supplier-syncs-${supplierId}`).emit('sync_failed', {
      error,
      timestamp: Date.now(),
    });

    this.server.to('admin-syncs').emit('sync_failed', {
      supplierId,
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Émettre une mise à jour de statut de livraison
   */
  emitPackageStatusUpdate(packageCode: string, status: string): void {
    this.logger.debug(`Emitting package status update: ${packageCode} -> ${status}`);

    this.server.to(`package-${packageCode}`).emit('package_status_updated', {
      packageCode,
      status,
      timestamp: Date.now(),
    });

    this.server.to('admin-logistics').emit('package_status_updated', {
      packageCode,
      status,
      timestamp: Date.now(),
    });
  }

  /**
   * Émettre une notification générale aux admins
   */
  emitAdminNotification(type: string, data: any): void {
    this.logger.debug(`Emitting admin notification: ${type}`);

    this.server.to('admin-panel').emit('notification', {
      type,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Émettre une notification à un utilisateur spécifique
   */
  emitUserNotification(userId: string, type: string, data: any): void {
    const socketIds = this.connectedClients.get(userId);
    if (!socketIds || socketIds.size === 0) {
      this.logger.debug(`User ${userId} not connected, notification queued`);
      // TODO: Persister en DB pour délivrance ultérieure
      return;
    }

    socketIds.forEach((socketId) => {
      this.server.to(socketId).emit('notification', {
        type,
        data,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Obtenir le nombre de clients connectés
   */
  getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Obtenir le nombre de sockets actives en total
   */
  getActiveSockets(): number {
    return Array.from(this.connectedClients.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );
  }

  /**
   * Obtenir les utilisateurs connectés (debug)
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
