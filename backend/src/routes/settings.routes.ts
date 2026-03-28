import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { userSettingsService, FREE_DAILY_LIMIT } from '../services/userSettings.service';
import { DEFAULT_MODELS } from '../engine/MultiProviderEngine';

const router = Router();
router.use(authMiddleware);

// GET /api/settings — get user settings (keys redacted)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const config   = await userSettingsService.getUserConfig(req.user!.id);
    const settings = await userSettingsService.getSettings(req.user!.id);
    res.json({
      provider:        config.provider,
      model:           config.model,
      theme:           settings.theme,
      fontSize:        settings.fontSize,
      codeTheme:       settings.codeTheme,
      isFreeUser:      config.isFreeUser,
      messagesLeft:    config.messagesLeft,
      dailyLimit:      FREE_DAILY_LIMIT,
      // Only tell client whether keys exist — never return actual keys
      hasGroqKey:      !!settings.groqKey,
      hasOpenaiKey:    !!settings.openaiKey,
      hasAnthropicKey: !!settings.anthropicKey,
      hasOpenrouterKey:!!settings.openrouterKey,
      availableModels: DEFAULT_MODELS,
    });
  } catch (err) { next(err); }
});

// PUT /api/settings — update settings
router.put('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { provider, model, theme, fontSize, codeTheme,
            groqKey, openaiKey, anthropicKey, openrouterKey } = req.body;

    await userSettingsService.updateSettings(req.user!.id, {
      ...(provider    && { provider }),
      ...(model       && { model }),
      ...(theme       && { theme }),
      ...(fontSize    && { fontSize }),
      ...(codeTheme   && { codeTheme }),
      ...('groqKey'       in req.body && { groqKey }),
      ...('openaiKey'     in req.body && { openaiKey }),
      ...('anthropicKey'  in req.body && { anthropicKey }),
      ...('openrouterKey' in req.body && { openrouterKey }),
    });
    res.json({ message: 'Settings updated' });
  } catch (err) { next(err); }
});

export default router;
