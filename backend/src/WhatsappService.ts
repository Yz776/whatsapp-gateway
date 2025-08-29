import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidGroup,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WAMessage,
  WAMessageStatus,
  WAMessageUpdate,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import fs from 'fs';
import axios from 'axios';
import { SocketServer } from './SocketServer';
import { ConnectionStatus, Contact, DashboardStats, Message, WebhookEvent } from './types';

const AUTH_FILE_PATH = './auth_info';

export class WhatsappService {
  private sock: any = null;
  private logger = pino({ level: 'silent' }).child({ level: 'silent' });
  private socketServer: SocketServer;
  
  // State
  private connectionStatus: ConnectionStatus = 'DISCONNECTED';
  private qrCode: string | null = null;
  private pairingCode: string | null = null;
  private connectedPhone: string | null = null;
  private webhookUrl: string = '';
  private isWebhookEnabled: boolean = false;
  private webhookEvents: WebhookEvent[] = [];
  private dashboardStats: DashboardStats = this.getInitialStats();

  constructor(socketServer: SocketServer) {
    this.socketServer = socketServer;
    // Periodically update dashboard stats
    setInterval(() => {
        this.socketServer.emitDashboardStats(this.dashboardStats);
    }, 5000);
  }

  public getInitialData() {
    return {
      connectionStatus: this.connectionStatus,
      qrCode: this.qrCode,
      pairingCode: this.pairingCode,
      webhookUrl: this.webhookUrl,
      isWebhookEnabled: this.isWebhookEnabled,
      webhookEvents: this.webhookEvents,
      dashboardStats: this.dashboardStats,
      connectedPhone: this.connectedPhone,
      // Contacts and messages would be loaded on demand or from a DB in a real app
    };
  }

  private getInitialStats(): DashboardStats {
      return {
        messageSent: 0,
        messageReceived: 0,
        webhookEvents: 0,
        apiCalls: 0,
        sentChange: 0,
        receivedChange: 0,
        webhookChange: 0,
        apiCallsChange: 0,
        weeklyTraffic: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ name: day, sent: 0, received: 0 })),
      };
  }
  
  private updateStatus(status: ConnectionStatus, phone?: string): void {
    this.connectionStatus = status;
    this.connectedPhone = phone || this.connectedPhone;
    this.socketServer.emitStatusUpdate(status, this.connectedPhone ?? undefined);
  }

  async connectToWhatsApp() {
    if (this.sock) {
      console.log('[Whatsapp] Already connected or connecting.');
      // If there's a QR, resend it
      if (this.qrCode) this.socketServer.emitQRCode(this.qrCode);
      return;
    }

    this.updateStatus('PAIRING');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FILE_PATH);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[Whatsapp] Using WA version v${version.join('.')}, isLatest: ${isLatest}`);

    this.sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger),
      },
      logger: this.logger,
      printQRInTerminal: false, // We'll handle QR manually
      browser: ['WA-Gateway', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
    });

    this.setupEventListeners();
    this.sock.ev.on('creds.update', saveCreds);
  }

  async requestPairingCode(phoneNumber: string) {
    if (!this.sock) {
      await this.connectToWhatsApp();
    }
    try {
      const code = await this.sock.requestPairingCode(phoneNumber);
      this.pairingCode = code;
      this.socketServer.emitPairingCode(code);
      console.log(`[Whatsapp] Pairing code for ${phoneNumber}: ${code}`);
    } catch (error) {
      console.error('[Whatsapp] Failed to request pairing code:', error);
      this.socketServer.emitPairingError('Could not request pairing code. Is the phone number valid?');
    }
  }

  private setupEventListeners() {
    this.sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        this.updateStatus('PAIRING');
        console.log('[Whatsapp] QR code received');
        this.qrCode = await qrcode.toDataURL(qr);
        this.socketServer.emitQRCode(this.qrCode);
      }
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`[Whatsapp] Connection closed due to: ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          this.connectToWhatsApp();
        } else {
          console.log('[Whatsapp] Logged out. Cleaning up.');
          this.cleanup();
          this.updateStatus('DISCONNECTED');
        }
      } else if (connection === 'open') {
        console.log('[Whatsapp] Connection opened');
        this.qrCode = null;
        this.pairingCode = null;
        const phone = this.sock.user?.id.split(':')[0];
        this.updateStatus('CONNECTED', phone);
      }
    });

    this.sock.ev.on('messages.upsert', async ({ messages }: { messages: WAMessage[] }) => {
        messages.forEach(async msg => {
            if (msg.key.fromMe || !msg.message) return;

            const senderId = msg.key.remoteJid!;
            const senderName = msg.pushName || senderId;
            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || 'Unsupported message type';
            
            this.dashboardStats.messageReceived++;
            this.dashboardStats.weeklyTraffic[new Date().getDay()].received++;

            const contact: Contact = {
                id: senderId,
                name: senderName,
                lastMessage: messageText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatarUrl: await this.getAvatar(senderId),
                unreadCount: 1,
            };
            const message: Message = {
                id: msg.key.id!,
                text: messageText,
                timestamp: new Date(Number(msg.messageTimestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: 'them',
                status: 'delivered',
            };
            
            this.socketServer.emitNewMessage(contact, message);
            this.triggerWebhook('newMessage', { contact, message });
        });
    });

    this.sock.ev.on('messages.update', (updates: WAMessageUpdate[]) => {
        updates.forEach(update => {
            if (update.key.fromMe && update.update.status) {
                const statusMap: { [key in WAMessageStatus]: 'sent' | 'delivered' | 'read' } = {
                    [WAMessageStatus.PENDING]: 'sent',
                    [WAMessageStatus.SERVER_ACK]: 'sent',
                    [WAMessageStatus.DELIVERY_ACK]: 'delivered',
                    [WAMessageStatus.READ]: 'read',
                    [WAMessageStatus.PLAYED]: 'read', // Treat played voice notes as read
                    [WAMessageStatus.ERROR]: 'sent',
                };
                const newStatus = statusMap[update.update.status];
                if (newStatus) {
                    this.socketServer.emitMessageUpdate(update.key.remoteJid!, update.key.id!, newStatus);
                }
            }
        });
    });
  }

  public async sendMessage(to: string, text: string) {
    if (this.connectionStatus !== 'CONNECTED') {
      console.error('[Whatsapp] Cannot send message, not connected.');
      return null;
    }
    try {
      const result = await this.sock.sendMessage(to, { text });
      console.log(`[Whatsapp] Message sent to ${to}`);
      this.dashboardStats.messageSent++;
      this.dashboardStats.weeklyTraffic[new Date().getDay()].sent++;
      this.triggerWebhook('messageSent', { to, text, messageId: result.key.id });
      return result;
    } catch (error) {
      console.error(`[Whatsapp] Failed to send message to ${to}:`, error);
      return null;
    }
  }

  public trackApiCall() {
    this.dashboardStats.apiCalls++;
  }

  public async logout() {
    if (this.sock) {
      await this.sock.logout();
    }
    this.cleanup();
  }
  
  private cleanup() {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      fs.rmSync(AUTH_FILE_PATH, { recursive: true, force: true });
    }
    this.sock = null;
    this.qrCode = null;
    this.pairingCode = null;
    this.connectedPhone = null;
    this.dashboardStats = this.getInitialStats();
    this.updateStatus('DISCONNECTED');
  }

  private async getAvatar(jid: string): Promise<string> {
    try {
        const url = await this.sock.profilePictureUrl(jid, 'image');
        return url;
    } catch (e) {
        return `https://i.pravatar.cc/150?u=${jid}`; // Fallback avatar
    }
  }

  public setWebhookConfig(url: string, enabled: boolean) {
      this.webhookUrl = url;
      this.isWebhookEnabled = enabled;
      console.log(`[Webhook] Config updated: URL=${url}, Enabled=${enabled}`);
  }

  private async triggerWebhook(event: string, payload: object) {
      if (!this.isWebhookEnabled || !this.webhookUrl) return;

      const eventData: WebhookEvent = {
          id: `wh_${Date.now()}`,
          event,
          payload,
          status: 'FAILED',
          timestamp: new Date().toISOString(),
      };

      try {
          await axios.post(this.webhookUrl, eventData, { timeout: 5000 });
          eventData.status = 'SUCCESS';
          console.log(`[Webhook] Successfully sent event '${event}' to ${this.webhookUrl}`);
      } catch (error: any) {
          console.error(`[Webhook] Failed to send event '${event}' to ${this.webhookUrl}:`, error.message);
      } finally {
          this.dashboardStats.webhookEvents++;
          this.webhookEvents.unshift(eventData);
          if (this.webhookEvents.length > 50) this.webhookEvents.pop();
          this.socketServer.emitWebhookLog(eventData);
      }
  }
}
