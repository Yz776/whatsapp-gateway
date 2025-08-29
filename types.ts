
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
