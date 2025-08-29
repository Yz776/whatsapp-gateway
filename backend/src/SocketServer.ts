import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { WhatsappService } from './WhatsappService';
import { ClientToServerEvents, ServerToClientEvents, WebhookEvent, DashboardStats, ConnectionStatus } from './types';

export class SocketServer {
  public io: Server<ClientToServerEvents, ServerToClientEvents>;
  private whatsappService: WhatsappService | null = null;

  constructor(httpServer: HttpServer) {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: {
        origin: '*', // Allow all origins for simplicity
      },
    });
    this.setupListeners();
  }

  public setWhatsappService(service: WhatsappService) {
    this.whatsappService = service;
  }

  private setupListeners(): void {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log('A client connected:', socket.id);

      // Send initial data on connection
      if (this.whatsappService) {
        socket.emit('initialData', this.whatsappService.getInitialData());
      }
      
      socket.on('requestQR', () => {
        console.log(`[Socket] Client ${socket.id} requested QR code`);
        this.whatsappService?.connectToWhatsApp();
      });
      
      socket.on('requestCode', ({ phoneNumber }) => {
        console.log(`[Socket] Client ${socket.id} requested pairing code for ${phoneNumber}`);
        this.whatsappService?.requestPairingCode(phoneNumber);
      });

      socket.on('sendMessage', async ({ to, text, tempId }) => {
        console.log(`[Socket] Client ${socket.id} sending message to ${to}`);
        const result = await this.whatsappService?.sendMessage(to, text);
        if (result) {
            // Confirm message was sent and update its ID
            this.io.emit('messageUpdate', { chatId: to, messageId: tempId, status: 'sent' });
            // The real ID update will come from the message.update event from Baileys
        }
      });
      
      socket.on('logout', () => {
        console.log(`[Socket] Client ${socket.id} requested logout`);
        this.whatsappService?.logout();
      });

      socket.on('saveWebhook', ({ url, enabled }) => {
        console.log(`[Socket] Client ${socket.id} saved webhook config`);
        this.whatsappService?.setWebhookConfig(url, enabled);
        // Optionally, send a confirmation back
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // --- Emitters to be called from WhatsappService ---

  public emitStatusUpdate(status: ConnectionStatus, phone?: string): void {
    this.io.emit('statusUpdate', { status, phone });
  }

  public emitQRCode(qr: string): void {
    this.io.emit('qr', { qr });
  }

  public emitPairingCode(code: string): void {
      this.io.emit('code', { code });
  }

  public emitPairingError(message: string): void {
    this.io.emit('pairingError', { message });
  }

  public emitNewMessage(contact: any, message: any): void {
    this.io.emit('newMessage', { contact, message });
  }

  public emitMessageUpdate(chatId: string, messageId: string, status: 'sent' | 'delivered' | 'read'): void {
    this.io.emit('messageUpdate', { chatId, messageId, status });
  }

  public emitWebhookLog(event: WebhookEvent): void {
    this.io.emit('webhookLog', event);
  }
  
  public emitDashboardStats(stats: DashboardStats): void {
    this.io.emit('dashboardStats', stats);
  }
}
