/**
 * MultiProviderEngine — unified streaming across providers
 * 
 * All providers except Anthropic use the OpenAI-compatible chat completions API.
 * Confirmed from official docs March 2026:
 * - Groq:       https://api.groq.com/openai/v1  (groq-sdk)
 * - OpenRouter: https://openrouter.ai/api/v1    (OpenAI-compatible)
 * - OpenAI:     https://api.openai.com/v1       (openai-sdk)
 * - Anthropic:  fetch to https://api.anthropic.com/v1/messages
 */
import Groq from 'groq-sdk';
import { logger } from '../utils/logger';

export type Provider = 'groq' | 'openai' | 'openrouter' | 'anthropic';

export interface UserConfig {
  provider:      Provider;
  model:         string;
  apiKey:        string;
}

export interface Message {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

// ── Provider configs (verified March 2026) ─────────────────────
const PROVIDER_CONFIG: Record<Provider, { baseURL: string; name: string }> = {
  groq:       { baseURL: 'https://api.groq.com/openai/v1',   name: 'Groq'       },
  openai:     { baseURL: 'https://api.openai.com/v1',         name: 'OpenAI'     },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1',      name: 'OpenRouter' },
  anthropic:  { baseURL: 'https://api.anthropic.com/v1',      name: 'Anthropic'  },
};

// ── Default free models per provider ───────────────────────────
export const DEFAULT_MODELS: Record<Provider, string[]> = {
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'moonshotai/kimi-k2-0905-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'qwen/qwen3-32b',
    'groq/compound',
  ],
  openai: [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
    'gpt-3.5-turbo', 'o1', 'o1-mini', 'o3-mini',
  ],
  openrouter: [
    // Free models (end in :free) — confirmed March 2026
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen3-coder-480b-a22b-instruct:free',
    'microsoft/phi-4-reasoning:free',
    'google/gemma-3n-e4b-it:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
    // Paid models
    'anthropic/claude-sonnet-4-6',
    'openai/gpt-4o',
    'google/gemini-2.5-pro',
    'deepseek/deepseek-r1',
  ],
  anthropic: [
    'claude-sonnet-4-6',
    'claude-opus-4-6',
    'claude-haiku-4-5-20251001',
  ],
};

class MultiProviderEngine {
  /**
   * Stream a chat completion from any provider.
   * Uses native fetch for OpenAI-compatible APIs.
   * Uses dedicated path for Anthropic (different API format).
   */
  async stream(
    config:   UserConfig,
    messages: Message[],
    system:   string,
    onChunk:  (chunk: string) => void,
  ): Promise<string> {
    if (config.provider === 'anthropic') {
      return this.streamAnthropic(config, messages, system, onChunk);
    }
    return this.streamOpenAICompat(config, messages, system, onChunk);
  }

  /**
   * OpenAI-compatible streaming (Groq, OpenAI, OpenRouter all work the same way)
   */
  private async streamOpenAICompat(
    config:   UserConfig,
    messages: Message[],
    system:   string,
    onChunk:  (chunk: string) => void,
  ): Promise<string> {
    const { baseURL } = PROVIDER_CONFIG[config.provider];
    const allMessages = [
      { role: 'system', content: system },
      ...messages,
    ];

    const headers: Record<string, string> = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    // OpenRouter requires these headers
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://claudgpt.vercel.app';
      headers['X-Title']      = 'ClaudGPT';
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method:  'POST',
      headers,
      body: JSON.stringify({
        model:       config.model,
        messages:    allMessages,
        stream:      true,
        max_tokens:  8192,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`${PROVIDER_CONFIG[config.provider].name} API error ${response.status}: ${err}`);
    }

    const reader  = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No response body');

    let fullResponse = '';
    let buffer       = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const chunk  = parsed.choices?.[0]?.delta?.content || '';
          if (chunk) { onChunk(chunk); fullResponse += chunk; }
        } catch { /* ignore parse errors */ }
      }
    }

    return fullResponse;
  }

  /**
   * Anthropic-specific streaming (different API format)
   * Docs: https://docs.anthropic.com/en/api/messages-streaming
   */
  private async streamAnthropic(
    config:   UserConfig,
    messages: Message[],
    system:   string,
    onChunk:  (chunk: string) => void,
  ): Promise<string> {
    // Anthropic uses separate system field, not in messages array
    const anthropicMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      config.model,
        system,
        messages:   anthropicMessages,
        max_tokens: 8192,
        stream:     true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    const reader  = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No response body');

    let fullResponse = '';
    let buffer       = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'content_block_delta') {
            const chunk = parsed.delta?.text || '';
            if (chunk) { onChunk(chunk); fullResponse += chunk; }
          }
        } catch { /* ignore */ }
      }
    }

    return fullResponse;
  }

  /**
   * Non-streaming completion (used for title generation, JSON extraction)
   */
  async complete(config: UserConfig, prompt: string, system?: string): Promise<string> {
    if (config.provider === 'groq') {
      // Use Groq SDK for non-streaming (faster)
      const client = new Groq({ apiKey: config.apiKey });
      const res    = await client.chat.completions.create({
        model:    config.model,
        messages: [
          { role: 'system',  content: system || 'You are a helpful AI assistant.' },
          { role: 'user',    content: prompt },
        ],
        max_tokens: 1024,
        stream:     false,
      });
      return res.choices[0]?.message?.content || '';
    }

    // OpenAI-compatible for all others
    const { baseURL } = PROVIDER_CONFIG[config.provider];
    const headers: Record<string, string> = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://claudgpt.vercel.app';
      headers['X-Title']      = 'ClaudGPT';
    }
    if (config.provider === 'anthropic') {
      headers['x-api-key']         = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];
    }

    const url = config.provider === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : `${baseURL}/chat/completions`;

    const body = config.provider === 'anthropic'
      ? { model: config.model, system, messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }
      : { model: config.model, messages: [
          { role: 'system', content: system || '' },
          { role: 'user',   content: prompt },
        ], max_tokens: 1024, stream: false };

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json() as Record<string, unknown>;

    if (config.provider === 'anthropic') {
      const content = data.content as Array<{text?: string}> | undefined;
      return content?.[0]?.text || '';
    }
    const choices = data.choices as Array<{message?: {content?: string}}> | undefined;
    return choices?.[0]?.message?.content || '';
  }
}

export const multiProviderEngine = new MultiProviderEngine();
