import React from 'react';
import { AppView, ConnectionStatus } from '../types';

interface HeaderProps {
  currentView: AppView;
  connectionStatus: ConnectionStatus;
  connectedPhone: string | null;
}

const StatusIndicator: React.FC<{ status: ConnectionStatus, phone: string | null }> = ({ status, phone }) => {
  const statusConfig = {
    CONNECTED: { text: `Connected: ${phone || ''}`, color: 'bg-green-500' },
    DISCONNECTED: { text: 'Disconnected', color: 'bg-red-500' },
    PAIRING: { text: 'Pairing...', color: 'bg-yellow-500' },
    ERROR: { text: 'Error', color: 'bg-red-700' },
  };

  const { text, color } = statusConfig[status];

  return (
    <div className="flex items-center">
      <span className={`h-3 w-3 rounded-full ${color} mr-2 ${status !== 'DISCONNECTED' ? 'animate-pulse' : ''}`}></span>
      <span className="text-sm font-medium text-text-secondary">{text}</span>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ currentView, connectionStatus, connectedPhone }) => {
  const viewTitles: Record<AppView, string> = {
    dashboard: 'Dashboard',
    chat: 'Live Chat',
    apidocs: 'API Documentation',
    settings: 'Settings & Configuration',
  };

  return (
    <header className="bg-sidebar border-b border-border p-4 flex justify-between items-center flex-shrink-0">
      <h2 className="text-2xl font-bold text-text-primary capitalize">{viewTitles[currentView]}</h2>
      <div className="flex items-center space-x-4">
        <StatusIndicator status={connectionStatus} phone={connectedPhone} />
        <img
          src="https://i.pravatar.cc/40"
          alt="User Avatar"
          className="w-10 h-10 rounded-full border-2 border-secondary"
        />
      </div>
    </header>
  );
};

export default Header;
