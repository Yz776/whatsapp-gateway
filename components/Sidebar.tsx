
import React from 'react';
import { AppView } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { ChatIcon } from './icons/ChatIcon';
import { DocsIcon } from './icons/DocsIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-secondary text-white shadow-lg'
          : 'text-text-secondary hover:bg-card hover:text-text-primary'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <nav className="w-64 h-full bg-sidebar text-text-primary p-4 flex flex-col flex-shrink-0">
      <div className="flex items-center mb-10 px-2">
        <img src="https://picsum.photos/40/40?grayscale" alt="Logo" className="rounded-full mr-3"/>
        <h1 className="text-xl font-bold tracking-wider">WA Gateway</h1>
      </div>
      <div className="space-y-2">
        <NavItem
          icon={<DashboardIcon className="w-5 h-5" />}
          label="Dashboard"
          isActive={currentView === 'dashboard'}
          onClick={() => setView('dashboard')}
        />
        <NavItem
          icon={<ChatIcon className="w-5 h-5" />}
          label="Chat"
          isActive={currentView === 'chat'}
          onClick={() => setView('chat')}
        />
        <NavItem
          icon={<DocsIcon className="w-5 h-5" />}
          label="API Docs"
          isActive={currentView === 'apidocs'}
          onClick={() => setView('apidocs')}
        />
        <NavItem
          icon={<SettingsIcon className="w-5 h-5" />}
          label="Settings"
          isActive={currentView === 'settings'}
          onClick={() => setView('settings')}
        />
      </div>
      <div className="mt-auto p-4 bg-card rounded-lg text-center">
        <p className="text-sm text-text-secondary">© 2024 WA Gateway Inc.</p>
        <p className="text-xs text-text-secondary/70 mt-1">All rights reserved.</p>
      </div>
    </nav>
  );
};

export default Sidebar;
