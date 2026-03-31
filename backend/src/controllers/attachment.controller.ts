import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { attachmentService, ParsedAttachment } from '../services/attachment.service';
import { groqEngine, VisionMessage } from '../engine/GroqEngine';
import { supabaseService } from '../services/supabase.service';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

class AttachmentController {
  // ── Parse uploaded text/code file ────────────────────────
  async parseFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { filename, content, mimeType } = req.body;
      if (!filename || !content) throw createError('filename and content required', 400);

      const attachment = attachmentService.processTextFile(filename, content, mimeType || 'text/plain');
      res.json({ attachment });
    } catch (err) { next(err); }
  }

  // ── Analyse image with Llama 4 Scout vision ───────────────
  async analyseImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { filename, base64, mimeType, prompt } = req.body;
      if (!base64 || !mimeType) throw createError('base64 and mimeType required', 400);

      const imageUrl = `data:${mimeType};base64,${base64}`;
      const userPrompt = prompt || 'Describe this image in detail. If it contains code, extract and explain it. If it contains a UI/design, describe the layout and components.';

      const visionMessages: VisionMessage[] = [{
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      }];

      const description = await groqEngine.visionChat(visionMessages);

      res.json({
        description,
        attachment: attachmentService.processImage(filename || 'image', base64, mimeType),
      });
    } catch (err) { next(err); }
  }

  // ── Fetch GitHub repository ───────────────────────────────
  async fetchGitHub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { repoUrl } = req.body;
      if (!repoUrl) throw createError('repoUrl required', 400);
      if (!repoUrl.includes('github.com')) throw createError('Only GitHub URLs are supported', 400);

      const attachments = await attachmentService.fetchGitHubRepo(repoUrl);
      res.json({ attachments, fileCount: attachments.length });
    } catch (err) { next(err); }
  }

  // ── Chat with full attachment context ─────────────────────
  async chatWithContext(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, sessionId, attachments, images } = req.body;
      if (!message && !attachments?.length && !images?.length) {
        throw createError('message or attachments required', 400);
      }

      // Build context from text attachments
      const textAttachments: ParsedAttachment[] = attachments || [];
      const context = attachmentService.buildAttachmentContext(textAttachments);

      // If images present → use vision model
      if (images && images.length > 0) {
        const image = images[0]; // Process first image
        const imageUrl = `data:${image.mimeType};base64,${image.base64}`;

        const visionMessages: VisionMessage[] = [{
          role: 'user',
          content: [
            { type: 'text', text: `${message || 'Analyse this'}${context}` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        }];

        const response = await groqEngine.visionChat(visionMessages);

        if (sessionId) {
          await supabaseService.saveMessage(sessionId, 'user', message || '[Image uploaded]');
          await supabaseService.saveMessage(sessionId, 'assistant', response);
        }

        return res.json({ response, modelUsed: 'llama-4-scout (vision)' });
      }

      // Text-only with file context
      const history = sessionId ? await supabaseService.getMessages(sessionId, 20) : [];
      const messages = history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      messages.push({ role: 'user', content: message + context });

      const response = await groqEngine.chat(messages, undefined, { agentType: 'chat' });

      if (sessionId) {
        await supabaseService.saveMessage(sessionId, 'user', message);
        await supabaseService.saveMessage(sessionId, 'assistant', response);
      }

      res.json({ response });
    } catch (err) { next(err); }
  }
}

export const attachmentController = new AttachmentController();
