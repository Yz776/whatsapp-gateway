import React, { useState, useEffect, useRef } from 'react';
import { Contact } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { useAppContext } from '../context/AppContext';

const ChatView: React.FC = () => {
  const { contacts, messages, sendMessage, connectionStatus } = useAppContext();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0]);
    }
    if (selectedContact && !contacts.find(c => c.id === selectedContact.id)) {
        setSelectedContact(contacts.length > 0 ? contacts[0] : null);
    }
  }, [contacts, selectedContact]);

  const currentMessages = selectedContact ? messages[selectedContact.id] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedContact) return;
    sendMessage(selectedContact.id, newMessage);
    setNewMessage('');
  };
  
  if (connectionStatus !== 'CONNECTED') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary bg-card rounded-xl">
            <h2 className="text-2xl font-bold mb-2">Not Connected</h2>
            <p>Please connect your device in the Settings page to start chatting.</p>
        </div>
    );
  }

  if (contacts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary bg-card rounded-xl">
            <h2 className="text-2xl font-bold mb-2">No Chats Yet</h2>
            <p>Your conversations will appear here once you send or receive a message.</p>
        </div>
      );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] bg-card rounded-xl shadow-lg overflow-hidden">
      {/* Contact List */}
      <div className="w-1/3 border-r border-border bg-sidebar/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <input type="text" placeholder="Search or start new chat" className="w-full bg-content px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div key={contact.id} onClick={() => setSelectedContact(contact)}
                 className={`flex items-center p-3 cursor-pointer hover:bg-content ${selectedContact?.id === contact.id ? 'bg-content' : ''}`}>
              <img src={contact.avatarUrl || `https://i.pravatar.cc/150?u=${contact.id}`} alt={contact.name} className="w-12 h-12 rounded-full mr-4" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{contact.name}</h4>
                  <p className="text-xs text-text-secondary">{contact.timestamp}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-text-secondary truncate w-48">{contact.lastMessage}</p>
                  {contact.unreadCount > 0 && 
                    <span className="bg-tertiary text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{contact.unreadCount}</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message View */}
      {selectedContact ? (
        <div className="w-2/3 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center p-3 border-b border-border bg-sidebar/50">
            <img src={selectedContact.avatarUrl || `https://i.pravatar.cc/150?u=${selectedContact.id}`} alt={selectedContact.name} className="w-10 h-10 rounded-full mr-4" />
            <div>
              <h4 className="font-semibold">{selectedContact.name}</h4>
              <p className="text-xs text-text-secondary">online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto bg-content/50" style={{ backgroundImage: 'url("https://i.imgur.com/hi2v36w.png")', backgroundSize: 'cover' }}>
            <div className="space-y-4">
              {currentMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-3 rounded-lg shadow ${msg.sender === 'me' ? 'bg-outgoing-bubble' : 'bg-incoming-bubble'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <div className="flex items-center justify-end mt-1">
                      <p className="text-xs text-text-secondary/70 mr-2">{msg.timestamp}</p>
                      {msg.sender === 'me' && <CheckCircleIcon className={`w-4 h-4 ${msg.status === 'read' ? 'text-blue-400' : 'text-text-secondary/70'}`} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-sidebar/50 border-t border-border">
            <div className="flex items-center bg-content rounded-lg">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent p-3 focus:outline-none"
              />
              <button onClick={handleSendMessage} className="p-3 text-text-secondary hover:text-tertiary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
         <div className="w-2/3 flex flex-col items-center justify-center text-text-secondary">
            <h2 className="text-2xl font-bold">Select a chat to start messaging</h2>
        </div>
      )}
    </div>
  );
};

export default ChatView;
