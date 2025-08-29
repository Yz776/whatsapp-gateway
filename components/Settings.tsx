
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

type PairingMode = 'qr' | 'code';

const Settings: React.FC = () => {
  const {
    connectionStatus,
    qrCode,
    pairingCode,
    pairingError,
    webhookUrl: initialWebhookUrl,
    isWebhookEnabled: initialIsWebhookEnabled,
    webhookEvents,
    saveWebhookConfig,
    requestNewQr,
    requestNewCode,
    logout,
    clearPairingError,
  } = useAppContext();

  const [pairingMode, setPairingMode] = useState<PairingMode>('qr');
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isWebhookEnabled, setIsWebhookEnabled] = useState(initialIsWebhookEnabled);

  useEffect(() => {
    setWebhookUrl(initialWebhookUrl);
    setIsWebhookEnabled(initialIsWebhookEnabled);
  }, [initialWebhookUrl, initialIsWebhookEnabled]);

  const handleSaveWebhook = () => {
      saveWebhookConfig(webhookUrl, isWebhookEnabled);
  };

  const handleRequestCode = () => {
    const sanitizedNumber = phoneNumber.replace(/\D/g, '');
    if (!sanitizedNumber) {
      alert('Please enter a valid phone number with country code.');
      return;
    }
    requestNewCode(sanitizedNumber);
  }

  const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-card p-6 rounded-xl shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-8">
        <Card title="Device Connection">
          {connectionStatus === 'CONNECTED' && (
             <div className="text-center">
               <p className="text-green-400 font-semibold">Device is connected!</p>
               <button onClick={logout} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
                 Logout Device
               </button>
             </div>
          )}
          {connectionStatus !== 'CONNECTED' && (
            <>
                {pairingError && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg text-center mb-4">
                        <p className="font-semibold">Pairing Failed</p>
                        <p className="text-sm mt-1">{pairingError}</p>
                        <button 
                        onClick={clearPairingError} 
                        className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                        >
                        Dismiss
                        </button>
                    </div>
                )}
                <div className="flex border-b border-border mb-4">
                  <button onClick={() => setPairingMode('qr')} className={`px-4 py-2 text-sm font-medium ${pairingMode === 'qr' ? 'border-b-2 border-tertiary text-tertiary' : 'text-text-secondary'}`}>
                    QR Code
                  </button>
                  <button onClick={() => setPairingMode('code')} className={`px-4 py-2 text-sm font-medium ${pairingMode === 'code' ? 'border-b-2 border-tertiary text-tertiary' : 'text-text-secondary'}`}>
                    Pairing Code
                  </button>
                </div>
                {pairingMode === 'qr' && (
                  <div className="text-center">
                    {qrCode ? (
                       <img src={qrCode} alt="QR Code" className="mx-auto rounded-lg border-4 border-border w-64 h-64" />
                    ) : (
                       <div className="mx-auto rounded-lg border-4 border-border w-64 h-64 bg-content flex items-center justify-center text-text-secondary">Requesting QR code...</div>
                    )}
                    <p className="text-text-secondary mt-4 text-sm">Scan this QR code with your WhatsApp mobile app.</p>
                    <button onClick={requestNewQr} className="mt-4 bg-secondary hover:bg-tertiary text-white font-bold py-2 px-4 rounded transition-colors">
                      Refresh QR
                    </button>
                  </div>
                )}
                {pairingMode === 'code' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="phone-number" className="block text-sm font-medium text-text-secondary mb-1">Your Phone Number</label>
                      <input type="tel" id="phone-number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g. 19999999999"
                            className="w-full bg-content px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-border" />
                      <p className="text-xs text-text-secondary/70 mt-1">Include country code, without '+' or '()'.</p>
                    </div>
                    {pairingCode && (
                        <div className="text-center bg-content p-4 rounded-lg">
                          <p className="text-text-secondary mb-2 text-sm">Enter this code on your linked device:</p>
                          <p className="text-4xl font-mono tracking-widest text-tertiary">{pairingCode}</p>
                        </div>
                    )}
                    <button onClick={handleRequestCode} className="w-full bg-secondary hover:bg-tertiary text-white font-bold py-2 px-4 rounded transition-colors">
                      Request Pairing Code
                   </button>
                  </div>
                )}
            </>
          )}
        </Card>

        <Card title="Webhook Configuration">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="webhook-toggle" className="text-text-primary font-medium">Enable Webhooks</label>
              <button onClick={() => setIsWebhookEnabled(!isWebhookEnabled)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isWebhookEnabled ? 'bg-tertiary' : 'bg-gray-600'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isWebhookEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label htmlFor="webhook-url" className="block text-sm font-medium text-text-secondary mb-1">Webhook URL</label>
              <input type="url" id="webhook-url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                     className="w-full bg-content px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-border" />
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveWebhook} className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded transition-colors">
                Save Webhook
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column */}
      <Card title="Recent Webhook Events" className="lg:h-[calc(100vh-140px)] flex flex-col">
        <div className="space-y-3 overflow-y-auto pr-2 flex-1">
          {webhookEvents.length > 0 ? webhookEvents.map(event => (
            <div key={event.id} className="bg-content p-3 rounded-lg text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className={`font-bold ${event.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>{event.event} - {event.status}</span>
                <span className="text-text-secondary/70">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="text-text-secondary mt-1 whitespace-pre-wrap text-[10px] bg-sidebar/50 p-2 rounded">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          )) : (
            <div className="text-center text-text-secondary py-10">No recent webhook events.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Settings;
