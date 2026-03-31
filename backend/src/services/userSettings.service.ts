import { supabaseService } from './supabase.service';
import { logger } from '../utils/logger';
import type { Provider, UserConfig } from '../engine/MultiProviderEngine';

// Default daily message limit for free tier users
export const FREE_DAILY_LIMIT = 25;

export interface UserSettings {
  provider:       Provider;
  model:          string;
  theme:          string;
  fontSize:       string;
  codeTheme:      string;
  groqKey?:       string;
  openaiKey?:     string;
  anthropicKey?:  string;
  openrouterKey?: string;
  messagesToday:  number;
  messagesResetAt: string;
}

class UserSettingsService {
  async getSettings(userId: string): Promise<UserSettings> {
    try {
      const { data, error } = await supabaseService.adminClient
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Create default settings for new user
        return this.createDefault(userId);
      }

      return {
        provider:       (data.provider as Provider) || 'groq',
        model:          data.model || 'llama-3.3-70b-versatile',
        theme:          data.theme || 'light',
        fontSize:       data.font_size || 'md',
        codeTheme:      data.code_theme || 'dark',
        groqKey:        data.groq_key || undefined,
        openaiKey:      data.openai_key || undefined,
        anthropicKey:   data.anthropic_key || undefined,
        openrouterKey:  data.openrouter_key || undefined,
        messagesToday:  data.messages_today || 0,
        messagesResetAt: data.messages_reset_at || new Date().toISOString().slice(0, 10),
      };
    } catch (err) {
      logger.error('getSettings error:', err);
      return this.defaultSettings();
    }
  }

  async updateSettings(userId: string, patch: Partial<UserSettings>): Promise<void> {
    const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.provider)      dbPatch.provider      = patch.provider;
    if (patch.model)         dbPatch.model         = patch.model;
    if (patch.theme)         dbPatch.theme         = patch.theme;
    if (patch.fontSize)      dbPatch.font_size      = patch.fontSize;
    if (patch.codeTheme)     dbPatch.code_theme     = patch.codeTheme;
    if ('groqKey' in patch)       dbPatch.groq_key       = patch.groqKey || null;
    if ('openaiKey' in patch)     dbPatch.openai_key     = patch.openaiKey || null;
    if ('anthropicKey' in patch)  dbPatch.anthropic_key  = patch.anthropicKey || null;
    if ('openrouterKey' in patch) dbPatch.openrouter_key = patch.openrouterKey || null;

    await supabaseService.adminClient
      .from('user_settings')
      .upsert({ user_id: userId, ...dbPatch }, { onConflict: 'user_id' });
  }

  async getUserConfig(userId: string): Promise<UserConfig & { isFreeUser: boolean; messagesLeft: number }> {
    const settings = await this.getSettings(userId);

    // Reset daily count if new day
    const today = new Date().toISOString().slice(0, 10);
    if (settings.messagesResetAt !== today) {
      await supabaseService.adminClient
        .from('user_settings')
        .upsert({ user_id: userId, messages_today: 0, messages_reset_at: today }, { onConflict: 'user_id' });
      settings.messagesToday = 0;
    }

    // Determine API key to use
    const hasOwnKey = !!(
      settings.groqKey || settings.openaiKey ||
      settings.anthropicKey || settings.openrouterKey
    );

    let apiKey = '';
    switch (settings.provider) {
      case 'groq':       apiKey = settings.groqKey || process.env.GROQ_API_KEY_1 || ''; break;
      case 'openai':     apiKey = settings.openaiKey || ''; break;
      case 'anthropic':  apiKey = settings.anthropicKey || ''; break;
      case 'openrouter': apiKey = settings.openrouterKey || ''; break;
    }

    // Fall back to Groq if no key for chosen provider
    const provider = apiKey ? settings.provider : 'groq';
    if (!apiKey) apiKey = process.env.GROQ_API_KEY_1 || '';

    const messagesLeft = hasOwnKey ? Infinity : Math.max(0, FREE_DAILY_LIMIT - settings.messagesToday);

    return {
      provider,
      model:       settings.model || 'llama-3.3-70b-versatile',
      apiKey,
      isFreeUser:  !hasOwnKey,
      messagesLeft,
    };
  }

  async incrementMessageCount(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabaseService.adminClient
        .from('user_settings')
        .select('messages_today, messages_reset_at')
        .eq('user_id', userId)
        .single();

      const currentCount = (data?.messages_reset_at === today)
        ? ((data?.messages_today || 0) + 1)
        : 1;

      await supabaseService.adminClient
        .from('user_settings')
        .upsert({
          user_id:            userId,
          messages_today:     currentCount,
          messages_reset_at:  today,
          updated_at:         new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (err) {
      logger.warn('incrementMessageCount error:', err);
    }
  }

  private async createDefault(userId: string): Promise<UserSettings> {
    const defaults = this.defaultSettings();
    try {
      await supabaseService.adminClient
        .from('user_settings')
        .upsert({ user_id: userId, ...defaults }, { onConflict: 'user_id' });
    } catch (e) { /* ignore */ }
    return defaults;
  }

  private defaultSettings(): UserSettings {
    return {
      provider:       'groq',
      model:          'llama-3.3-70b-versatile',
      theme:          'light',
      fontSize:       'md',
      codeTheme:      'dark',
      messagesToday:  0,
      messagesResetAt: new Date().toISOString().slice(0, 10),
    };
  }
}

export const userSettingsService = new UserSettingsService();
