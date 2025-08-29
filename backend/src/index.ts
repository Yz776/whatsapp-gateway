
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { SocketServer } from './SocketServer';
import { WhatsappService } from './WhatsappService';
import { apiRouter } from './api';

// Load environment variables from .env file
dotenv.config();

// Fix: Resolve __dirname for ES modules. `__dirname` is not available in ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

// --- Middleware ---
app.use(express.json()); // For parsing application/json in API requests

// --- Initialize Services ---
const socketServer = new SocketServer(httpServer);
const whatsappService = new WhatsappService(socketServer);
socketServer.setWhatsappService(whatsappService);

// --- API Routes ---
app.use('/api', apiRouter(whatsappService));

// --- Serve Frontend ---
// This serves the static files from the root directory where index.html is located
const frontendPath = path.join(__dirname, '..', '..');
app.use(express.static(frontendPath));

// Fallback to index.html for single-page applications
app.get('*', (req, res) => {
    // Check if the request is for an API endpoint or a file with an extension
    if (req.path.startsWith('/api/') || path.extname(req.path).length > 0) {
        res.status(404).send('Not Found');
    } else {
        res.sendFile(path.join(frontendPath, 'index.html'));
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Attempting to connect to WhatsApp...');
  // Initial connection attempt
  whatsappService.connectToWhatsApp();
});
