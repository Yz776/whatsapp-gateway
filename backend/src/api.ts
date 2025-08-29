import { Router, Request, Response, NextFunction } from 'express';
import { WhatsappService } from './WhatsappService';

export const apiRouter = (whatsappService: WhatsappService): Router => {
  const router = Router();

  // API Key Authentication Middleware
  const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
      whatsappService.trackApiCall();
      next();
    } else {
      res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid API Key' });
    }
  };

  router.use(apiKeyAuth);
  
  // --- Endpoints ---

  router.get('/status', (req: Request, res: Response) => {
    res.json(whatsappService.getInitialData());
  });

  router.post('/message/send', async (req: Request, res: Response) => {
    const { to, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ status: 'error', message: 'Missing "to" or "text" in request body' });
    }
    
    try {
      const result = await whatsappService.sendMessage(to, text);
      if (result) {
        res.json({ status: 'success', messageId: result.key.id });
      } else {
        res.status(500).json({ status: 'error', message: 'Failed to send message. Is the device connected?' });
      }
    } catch (error) {
      console.error('[API] Error sending message:', error);
      res.status(500).json({ status: 'error', message: 'An internal error occurred.' });
    }
  });

  // Placeholder for other message types from ApiDocs.tsx
  const notImplemented = (req: Request, res: Response) => {
    res.status(501).json({ status: 'error', message: 'Endpoint not implemented yet.' });
  };
  
  router.post('/message/send/image', notImplemented);
  router.post('/message/send/audio', notImplemented);
  router.post('/message/send/video', notImplemented);
  router.post('/message/send/location', notImplemented);
  router.post('/group/create', notImplemented);

  return router;
};
