import React, { useState, useCallback } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatView from './components/ChatView';
import ApiDocs from './components/ApiDocs';
import Settings from './components/Settings';
import Header from './components/Header';
import { useAppContext } from './context/AppContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const { connectionStatus, connectedPhone } = useAppContext();

  const handleViewChange = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <ChatView />;
      case 'apidocs':
        return <ApiDocs />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans">
      <Sidebar currentView={currentView} setView={handleViewChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentView={currentView} 
          connectionStatus={connectionStatus}
          connectedPhone={connectedPhone} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
