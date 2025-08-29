
import React from 'react';

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'json' }) => (
  <pre className="bg-sidebar p-4 rounded-lg overflow-x-auto">
    <code className={`language-${lang} text-sm text-text-secondary`}>
      {code.trim()}
    </code>
  </pre>
);

const ApiEndpoint: React.FC<{
  method: 'POST' | 'GET';
  path: string;
  description: string;
  children: React.ReactNode;
}> = ({ method, path, description, children }) => {
  const methodColor = method === 'POST' ? 'bg-green-600' : 'bg-blue-600';
  return (
    <div className="bg-card p-6 rounded-xl shadow-lg mb-8">
      <div className="flex items-center mb-2">
        <span className={`text-sm font-bold text-white px-3 py-1 rounded-md ${methodColor}`}>{method}</span>
        <span className="ml-3 font-mono text-lg text-text-primary">{path}</span>
      </div>
      <p className="text-text-secondary mb-4">{description}</p>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

const ApiDocs: React.FC = () => {
  return (
    <div>
       <div className="bg-card p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">Introduction</h2>
        <p className="text-text-secondary">This API allows you to programmatically interact with your WhatsApp account through this gateway. All requests should be authenticated with an API key provided in the header <code className="bg-sidebar px-1 rounded">X-API-KEY: YOUR_API_KEY</code>.</p>
        <p className="text-text-secondary mt-2">The <code className="bg-sidebar px-1 rounded">{`{to}`}</code> parameter in all sending endpoints should be a valid WhatsApp ID (JID), for example: <code className="bg-sidebar px-1 rounded">1234567890@s.whatsapp.net</code> for a person or <code className="bg-sidebar px-1 rounded">123456789-123345@g.us</code> for a group.</p>
      </div>

      <ApiEndpoint method="POST" path="/message/send" description="Sends a text message to a specific number.">
        <h4 className="font-semibold text-text-primary">Request Body</h4>
        <CodeBlock code={`
{
  "to": "1234567890@s.whatsapp.net",
  "text": "Hello, this is a test message from the gateway!"
}
        `} />
        <h4 className="font-semibold text-text-primary">Success Response (200)</h4>
        <CodeBlock code={`
{
  "status": "success",
  "messageId": "gbeGDEgY3snm"
}
        `} />
      </ApiEndpoint>
      
      <ApiEndpoint method="POST" path="/message/send/image" description="Sends an image message with a caption.">
        <h4 className="font-semibold text-text-primary">Request Body</h4>
        <CodeBlock code={`
{
  "to": "1234567890@s.whatsapp.net",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Check out this image!"
}
        `} />
         <h4 className="font-semibold text-text-primary">Success Response (200)</h4>
        <CodeBlock code={`
{
  "status": "success",
  "messageId": "gbeGDEgY3sno"
}
        `} />
      </ApiEndpoint>

      <ApiEndpoint method="POST" path="/message/send/audio" description="Sends an audio message. The audio will be sent as a voice note.">
        <h4 className="font-semibold text-text-primary">Request Body</h4>
        <CodeBlock code={`
{
  "to": "1234567890@s.whatsapp.net",
  "audioUrl": "https://example.com/audio.ogg"
}
        `} />
         <h4 className="font-semibold text-text-primary">Success Response (200)</h4>
        <CodeBlock code={`
{
  "status": "success",
  "messageId": "gbeGDEgY3snp"
}
        `} />
      </ApiEndpoint>

      <ApiEndpoint method="POST" path="/message/send/video" description="Sends a video message with a caption.">
        <h4 className="font-semibold text-text-primary">Request Body</h4>
        <CodeBlock code={`
{
  "to": "1234567890@s.whatsapp.net",
  "videoUrl": "https://example.com/video.mp4",
  "caption": "Check out this video!"
}
        `} />
         <h4 className="font-semibold text-text-primary">Success Response (200)</h4>
        <CodeBlock code={`
{
  "status": "success",
  "messageId": "gbeGDEgY3snq"
}
        `} />
      </ApiEndpoint>

       <ApiEndpoint method="POST" path="/message/send/location" description="Sends a location message.">
        <h4 className="font-semibold text-text-primary">Request Body</h4>
        <CodeBlock code={`
{
  "to": "1234567890@s.whatsapp.net",
  "latitude": 34.052235,
  "longitude": -118.243683
}
        `} />
         <h4 className="font-semibold text-text-primary">Success Response (200)</h4>
        <CodeBlock code={`
{
  "status": "success",
  "messageId": "gbeGDEgY3snr"
}
        `} />
      </ApiEndpoint>

      <ApiEndpoint method="POST" path="/group/create" description="Creates a new group with the given title and participants.">
        <h4 className="font-semibold text-text-primary">Request Body</h4>
        <CodeBlock code={`
{
  "title": "My Awesome Group",
  "participants": ["1234567890@s.whatsapp.net", "0987654321@s.whatsapp.net"]
}
        `} />
         <h4 className="font-semibold text-text-primary">Success Response (201)</h4>
        <CodeBlock code={`
{
  "status": "success",
  "groupId": "12036304...-16... @g.us",
  "participants": {
    "1234567890@s.whatsapp.net": { "code": "200" }
  }
}
        `} />
      </ApiEndpoint>

      <ApiEndpoint method="GET" path="/status" description="Retrieves the current connection status of the gateway.">
        <h4 className="font-semibold text-text-primary">Success Response (200)</h4>
        <CodeBlock code={`
{
  "status": "CONNECTED",
  "since": "2024-07-29T10:00:00Z"
}
        `} />
      </ApiEndpoint>
    </div>
  );
};

export default ApiDocs;
