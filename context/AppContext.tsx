
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConnectionStatus, Contact, Message, WebhookEvent } from '../types';

const SOCKET_URL = '/';

interface DashboardStats {
  messageSent: number;
  messageReceived: number;
  webhookEvents: number;
  apiCalls: number;
  sentChange: number;
  receivedChange: number;
  webhookChange: number;
  apiCallsChange: number;
  weeklyTraffic: { name: string; sent: number; received: number }[];
}

interface AppState {
  connectionStatus: ConnectionStatus;
  qrCode: string | null;
  pairingCode: string | null;
  pairingError: string | null;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  webhookEvents: WebhookEvent[];
  webhookUrl: string;
  isWebhookEnabled: boolean;
  dashboardStats: DashboardStats;
  connectedPhone: string | null;
}

interface AppContextType extends AppState {
  sendMessage: (to: string, text: string) => void;
  saveWebhookConfig: (url: string, enabled: boolean) => void;
  requestNewQr: () => void;
  requestNewCode: (phoneNumber: string) => void;
  logout: () => void;
  clearPairingError: () => void;
}

// Fix: Define event maps for socket.io to strongly type the socket client and resolve type errors on '.on' methods.
interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  initialData: (data: Partial<AppState>) => void;
  statusUpdate: (data: { status: ConnectionStatus; phone?: string }) => void;
  qr: (data: { qr: string }) => void;
  code: (data: { code: string }) => void;
  pairingError: (data: { message: string }) => void;
  newMessage: (data: { contact: Contact; message: Message }) => void;
  messageUpdate: (data: {
    messageId: string;
    chatId: string;
    status: 'sent' | 'delivered' | 'read';
  }) => void;
  webhookLog: (event: WebhookEvent) => void;
  dashboardStats: (stats: DashboardStats) => void;
}

interface ClientToServerEvents {
  sendMessage: (data: { to: string; text: string; tempId: string }) => void;
  requestQR: () => void;
  requestCode: (data: { phoneNumber: string }) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialStats: DashboardStats = {
  messageSent: 0,
  messageReceived: 0,
  webhookEvents: 0,
  apiCalls: 0,
  sentChange: 0,
  receivedChange: 0,
  webhookChange: 0,
  apiCallsChange: 0,
  weeklyTraffic: [
    { name: 'Mon', sent: 0, received: 0 },
    { name: 'Tue', sent: 0, received: 0 },
    { name: 'Wed', sent: 0, received: 0 },
    { name: 'Thu', sent: 0, received: 0 },
    { name: 'Fri', sent: 0, received: 0 },
    { name: 'Sat', sent: 0, received: 0 },
    { name: 'Sun', sent: 0, received: 0 },
  ],
};

const initialState: AppState = {
  connectionStatus: 'DISCONNECTED',
  qrCode: null,
  pairingCode: null,
  pairingError: null,
  contacts: [],
  messages: {},
  webhookEvents: [],
  webhookUrl: '',
  isWebhookEnabled: false,
  dashboardStats: initialStats,
  connectedPhone: null,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  // Fix: Use the typed socket for socketRef.
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    // Fix: Remove 'transports' option causing a type error and explicitly type the socket instance.
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
        console.log('Socket connected');
        // Automatically request a QR code on connection to improve initial user experience.
        socket.emit('requestQR');
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
        // Reset connection-specific state, but preserve user settings like webhooks.
        setState(s => ({
            ...s,
            connectionStatus: 'DISCONNECTED',
            qrCode: null,
            pairingCode: null,
            contacts: [],
            messages: {},
            connectedPhone: null,
        }));
    });

    socket.on('initialData', (data: Partial<AppState>) => {
        setState(s => ({ ...s, ...data }));
    });
    
    socket.on('statusUpdate', ({ status, phone }: { status: ConnectionStatus, phone?: string }) => {
        setState(s => ({
            ...s,
            connectionStatus: status,
            connectedPhone: phone || s.connectedPhone,
            // Bug Fix: Only clear pairing info once fully connected to prevent premature clearing.
            qrCode: status === 'CONNECTED' ? null : s.qrCode,
            pairingCode: status === 'CONNECTED' ? null : s.pairingCode,
        }));
    });

    socket.on('qr', ({ qr }: { qr: string }) => {
        setState(s => ({ ...s, qrCode: qr, connectionStatus: 'PAIRING', pairingCode: null, pairingError: null }));
    });

    socket.on('code', ({ code }: { code: string }) => {
        setState(s => ({ ...s, pairingCode: code, connectionStatus: 'PAIRING', qrCode: null, pairingError: null }));
    });

    socket.on('pairingError', ({ message }: { message: string }) => {
        setState(s => ({ ...s, pairingError: message, qrCode: null, pairingCode: null, connectionStatus: 'ERROR' }));
    });

    socket.on('newMessage', ({ contact, message }: { contact: Contact, message: Message }) => {
        setState(s => {
            const newContacts = [...s.contacts];
            const contactIndex = newContacts.findIndex(c => c.id === contact.id);
            if (contactIndex > -1) {
                const updatedContact = { ...newContacts[contactIndex], lastMessage: message.text, timestamp: message.timestamp };
                newContacts.splice(contactIndex, 1);
                newContacts.unshift(updatedContact);
            } else {
                newContacts.unshift(contact);
            }

            const newMessages = { ...s.messages };
            if (!newMessages[contact.id]) {
                newMessages[contact.id] = [];
            }
            newMessages[contact.id].push(message);

            return { ...s, contacts: newContacts, messages: newMessages };
        });
    });

    socket.on('messageUpdate', ({ messageId, chatId, status }: { messageId: string, chatId: string, status: 'sent' | 'delivered' | 'read' }) => {
        setState(s => {
            const chatMessages = s.messages[chatId];
            if (!chatMessages) return s;
            
            const newChatMessages = chatMessages.map(msg => 
                msg.id === messageId ? { ...msg, status } : msg
            );

            return { ...s, messages: { ...s.messages, [chatId]: newChatMessages } };
        });
    });

    socket.on('webhookLog', (event: WebhookEvent) => {
        setState(s => ({ ...s, webhookEvents: [event, ...s.webhookEvents.slice(0, 49)] }));
    });

    socket.on('dashboardStats', (stats: DashboardStats) => {
        setState(s => ({...s, dashboardStats: stats}));
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback((to: string, text: string) => {
      const tempId = `temp_${Date.now()}`;
      const message: Message = {
          id: tempId,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'me',
          status: 'sent',
      };

      setState(s => {
          const newMessages = { ...s.messages };
          if (!newMessages[to]) newMessages[to] = [];
          newMessages[to].push(message);

          const newContacts = [...s.contacts];
          const contactIndex = newContacts.findIndex(c => c.id === to);
          if(contactIndex > -1) {
            const updatedContact = { ...newContacts[contactIndex], lastMessage: text, timestamp: message.timestamp };
            newContacts.splice(contactIndex, 1);
            newContacts.unshift(updatedContact);
          }
          
          return { ...s, messages: newMessages, contacts: newContacts };
      });

      socketRef.current?.emit('sendMessage', { to, text, tempId });
  }, []);

  const saveWebhookConfig = useCallback(async (url: string, enabled: boolean) => {
      // In a real app, this would be a POST fetch request to an API.
      // fetch('/api/webhook', { method: 'POST', body: JSON.stringify({ url, enabled }), ... });
      console.log('Saving webhook config:', { url, enabled });
      setState(s => ({...s, webhookUrl: url, isWebhookEnabled: enabled}));
      alert('Webhook configuration saved!');
  }, []);

  const requestNewQr = useCallback(() => {
      // Provide immediate feedback by clearing old data and optimistically setting status.
      setState(s => ({ ...s, qrCode: null, pairingCode: null, pairingError: null, connectionStatus: 'PAIRING' }));
      socketRef.current?.emit('requestQR');
  }, []);
  
  const requestNewCode = useCallback((phoneNumber: string) => {
      // Provide immediate feedback by clearing old data and optimistically setting status.
      setState(s => ({ ...s, pairingCode: null, qrCode: null, pairingError: null, connectionStatus: 'PAIRING' }));
      socketRef.current?.emit('requestCode', { phoneNumber });
  }, []);

  const clearPairingError = useCallback(() => {
    setState(s => ({...s, pairingError: null, connectionStatus: 'DISCONNECTED' }));
  }, []);

  const logout = useCallback(() => socketRef.current?.emit('logout'), []);

  const value = { ...state, sendMessage, saveWebhookConfig, requestNewQr, requestNewCode, logout, clearPairingError };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
