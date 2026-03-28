-- User API keys and settings (encrypted at rest by Supabase)
CREATE TABLE IF NOT EXISTS user_settings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- API keys (stored as user enters them — Supabase RLS protects them)
  groq_key      TEXT,
  openai_key    TEXT,
  anthropic_key TEXT,
  openrouter_key TEXT,
  -- Preferences
  provider      TEXT DEFAULT 'groq',  -- groq | openai | anthropic | openrouter
  model         TEXT DEFAULT 'llama-3.3-70b-versatile',
  theme         TEXT DEFAULT 'light', -- light | dark
  code_theme    TEXT DEFAULT 'dark',
  font_size     TEXT DEFAULT 'md',    -- sm | md | lg
  -- Rate limiting for free tier
  messages_today    INTEGER DEFAULT 0,
  messages_reset_at DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS — users can only read/write their own settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
