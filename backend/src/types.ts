// These types are mirrored from the frontend for consistency.

export type AppView = 'dashboard' | 'chat' | 'apidocs' | 'settings';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTED' | 'PAIRING' | 'ERROR';

export interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'them';
  status: 'sent' | 'delivered' | 'read';
}

export interface WebhookEvent {
  id: string;
  event: string;
  payload: object;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export interface DashboardStats {
  messageSent: number;
  messageReceived: number;
  webhookEvents: number;
  apiCalls: number;
  sentChange: number; // For simplicity, we'll keep this 0 for now
  receivedChange: number;
  webhookChange: number;
  apiCallsChange: number;
  weeklyTraffic: { name: string; sent: number; received: number }[];
}

// Fix: Add strongly-typed definitions for Socket.IO events to ensure type safety between the client and server.
export interface ServerToClientEvents {
  initialData: (data: any) => void;
  statusUpdate: (data: { status: ConnectionStatus; phone?: string }) => void;
  qr: (data: { qr: string }) => void;
  code: (data: { code: string }) => void;
  pairingError: (data: { message: string }) => void;
  newMessage: (data: { contact: Contact; message: Message }) => void;
  messageUpdate: (data: { messageId: string; chatId: string; status: 'sent' | 'delivered' | 'read' }) => void;
  webhookLog: (event: WebhookEvent) => void;
  dashboardStats: (stats: DashboardStats) => void;
}

export interface ClientToServerEvents {
  requestQR: () => void;
  requestCode: (data: { phoneNumber: string }) => void;
  sendMessage: (data: { to: string; text: string; tempId: string }) => void;
  logout: () => void;
  saveWebhook: (data: { url: string; enabled: boolean }) => void;
}
