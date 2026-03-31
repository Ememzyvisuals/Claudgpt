import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseService } from '../services/supabase.service';
import { groqEngine } from '../engine/GroqEngine';
import { multiProviderEngine } from '../engine/MultiProviderEngine';
import { userSettingsService, FREE_DAILY_LIMIT } from '../services/userSettings.service';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

class ChatController {
  async createSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const s = await supabaseService.createChatSession(req.user!.id, req.body.title || 'New Chat');
      res.status(201).json({ session: s });
    } catch (err) { next(err); }
  }

  async getSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await supabaseService.getChatSessions(req.user!.id);
      res.json({ sessions });
    } catch (err) { next(err); }
  }

  async deleteSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await supabaseService.deleteChatSession(req.params.sessionId, req.user!.id);
      res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const messages = await supabaseService.getMessages(req.params.sessionId);
      res.json({ messages });
    } catch (err) { next(err); }
  }

  async streamChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, context, mode } = req.body;
      const { sessionId } = req.params;

      if (!message) throw createError('Message required', 400);

      // Set SSE headers first
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Save user message
      await supabaseService.saveMessage(sessionId, 'user', message);

      // Check if this is the first message — if so generate a real title
      const existingMessages = await supabaseService.getMessages(sessionId, 5);
      const isFirstMessage = existingMessages.filter(
        (m: { role: string }) => m.role === 'user'
      ).length === 1;

      if (isFirstMessage) {
        // Generate title from first message and update session
        try {
          const title = await groqEngine.generateTitle(message);
          await supabaseService.updateSessionTitle(sessionId, title);
          // Send title update to frontend via SSE
          res.write(`data: ${JSON.stringify({ titleUpdate: title })}\n\n`);
        } catch (e) {
          logger.warn('Title generation failed:', e);
        }
      }

      let fullResponse = '';

      // Search mode — use Groq Compound
      if (mode === 'search') {
        const { response } = await groqEngine.webSearch(message, context);
        fullResponse = response;
        res.write(`data: ${JSON.stringify({ chunk: response })}\n\n`);
      } else {
        // Normal streaming
        const history = await supabaseService.getMessages(sessionId, 20);
        const messages = history.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        await groqEngine.streamChat(
          messages,
          (chunk: string) => {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          },
          context,
          { agentType: 'chat' }
        );
      }

      // Save AI response
      await supabaseService.saveMessage(sessionId, 'assistant', fullResponse);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

    } catch (err) { next(err); }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, context, mode } = req.body;
      const { sessionId } = req.params;

      if (!message) throw createError('Message required', 400);

      await supabaseService.saveMessage(sessionId, 'user', message);

      let response = '';
      if (mode === 'search') {
        const result = await groqEngine.webSearch(message, context);
        response = result.response;
      } else {
        const history = await supabaseService.getMessages(sessionId, 20);
        const msgs = history.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        response = await groqEngine.chat(msgs, context);
      }

      await supabaseService.saveMessage(sessionId, 'assistant', response);
      res.json({ response });
    } catch (err) { next(err); }
  }
}

export const chatController = new ChatController();
