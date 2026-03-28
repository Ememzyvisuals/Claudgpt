import Groq from 'groq-sdk';
import { keyRotator } from './KeyRotator';
import { logger } from '../utils/logger';
import type { ChatMessage, GroqStreamOptions } from '../types';
import { APP_IDENTITY } from '../types';

// ─────────────────────────────────────────────────────────────
// GROQ MODELS — Verified March 18, 2026
// Source: console.groq.com/docs/models
// ─────────────────────────────────────────────────────────────
//
// PRODUCTION MODELS — Stable, will not be removed without notice
//   openai/gpt-oss-120b       500 tok/s  131K ctx  Best reasoning + code
//   openai/gpt-oss-20b        1000 tok/s 131K ctx  Ultra-fast
//   llama-3.3-70b-versatile   280 tok/s  131K ctx  All-rounder chat
//   llama-3.1-8b-instant      560 tok/s  131K ctx  Lightweight fast
//
// PREVIEW MODELS — Active NOW but "may be discontinued at short notice"
//   meta-llama/llama-4-scout-17b-16e-instruct  Vision, 10M ctx
//   moonshotai/kimi-k2-0905-instruct           Best coder, 256K ctx
//   qwen/qwen3-32b                             Thinking mode
//
// Strategy: Preview models are PRIMARY where available (better quality)
//           Production models are GUARANTEED FALLBACK (never break)
// ─────────────────────────────────────────────────────────────

export const GROQ_MODELS = {
  // ── PRODUCTION (guaranteed always active) ────────────────
  GPT_OSS_120B: 'openai/gpt-oss-120b',        // 500 tps — reasoning + code
  GPT_OSS_20B:  'openai/gpt-oss-20b',         // 1000 tps — ultra-fast
  LLAMA_33_70B: 'llama-3.3-70b-versatile',    // 280 tps  — chat + streaming
  LLAMA_31_8B:  'llama-3.1-8b-instant',       // 560 tps  — lightweight

  // ── PREVIEW (active now, great quality, fallback if removed) ─
  KIMI_K2:      'moonshotai/kimi-k2-0905-instruct', // best coder
  QWEN3_32B:    'qwen/qwen3-32b',                   // thinking mode
  LLAMA4_SCOUT: 'meta-llama/llama-4-scout-17b-16e-instruct', // vision

  // ── COMPOUND — built-in web search + code execution ──────
  // groq/compound  = multiple tool calls, full web search
  // groq/compound-mini = single tool call, 3x lower latency
  COMPOUND:      'groq/compound',       // web search + code exec
  COMPOUND_MINI: 'groq/compound-mini',  // fast single search
} as const;

// ── Agent routing: preview primary, production fallback ──────
const AGENT_PRIMARY: Record<string, string> = {
  coder:     GROQ_MODELS.KIMI_K2,       // preview: best coder
  debugger:  GROQ_MODELS.KIMI_K2,       // preview: best debugger
  architect: GROQ_MODELS.KIMI_K2,       // preview: 256K context
  planner:   GROQ_MODELS.GPT_OSS_120B,  // production: frontier reasoning
  reviewer:  GROQ_MODELS.GPT_OSS_120B,  // production: deep analysis
  search:    GROQ_MODELS.COMPOUND,      // web search built-in
  memory:    GROQ_MODELS.QWEN3_32B,     // preview: structured extraction
  tool:      GROQ_MODELS.LLAMA_33_70B,  // production: reliable
  export:    GROQ_MODELS.LLAMA_33_70B,  // production: reliable
  chat:      GROQ_MODELS.LLAMA_33_70B,  // production: fast streaming
  vision:    GROQ_MODELS.LLAMA4_SCOUT,  // preview: vision
};

// If a preview model fails, fall back to this production model
const AGENT_FALLBACK: Record<string, string> = {
  coder:     GROQ_MODELS.GPT_OSS_120B,  // best production coder
  debugger:  GROQ_MODELS.GPT_OSS_120B,
  architect: GROQ_MODELS.GPT_OSS_120B,
  planner:   GROQ_MODELS.GPT_OSS_120B,
  reviewer:  GROQ_MODELS.GPT_OSS_120B,
  search:    GROQ_MODELS.GPT_OSS_120B,
  memory:    GROQ_MODELS.LLAMA_33_70B,
  tool:      GROQ_MODELS.LLAMA_33_70B,
  export:    GROQ_MODELS.LLAMA_33_70B,
  chat:      GROQ_MODELS.LLAMA_33_70B,
  vision:    GROQ_MODELS.LLAMA_33_70B,  // text fallback if vision gone
};

const BASE_SYSTEM_PROMPT = `You are ClaudGPT, an elite AI development assistant created by ${APP_IDENTITY.creator} (${APP_IDENTITY.alias}) at ${APP_IDENTITY.company}.

Specialties: full-stack web apps (Next.js, React, Node.js, Express), WhatsApp bots, automation tools, REST APIs, debugging, code review, security analysis.

Identity:
- "Who are you?" → ClaudGPT by ${APP_IDENTITY.company}
- "Who created you?" → ${APP_IDENTITY.creator} (${APP_IDENTITY.alias}) at ${APP_IDENTITY.company}
- "What model powers you?" → Multiple frontier models (production + preview) via Groq ultra-fast inference

Code rules:
- ALWAYS write complete code — NEVER truncate or add placeholders
- Use TypeScript with strict types
- Include error handling in every file
- When writing files use fenced code blocks with the file path on the opening line:
\`\`\`typescript path/to/file.ts
// complete file content
\`\`\``;

export interface VisionMessage {
  role: 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >;
}

// ── Preview model IDs — for deprecation check ────────────────
const PREVIEW_MODEL_IDS = new Set<string>([
  GROQ_MODELS.KIMI_K2,
  GROQ_MODELS.QWEN3_32B,
  GROQ_MODELS.LLAMA4_SCOUT,
]);

class GroqEngine {
  private defaultModel: string;
  private deprecatedModels: Set<string> = new Set();

  constructor() {
    this.defaultModel = process.env.GROQ_MODEL || GROQ_MODELS.LLAMA_33_70B;

    logger.info('✅ GroqEngine initialised — verified March 18 2026');
    logger.info('   PRODUCTION (stable):');
    logger.info(`     ${GROQ_MODELS.GPT_OSS_120B} (~500 tps)`);
    logger.info(`     ${GROQ_MODELS.GPT_OSS_20B}  (~1000 tps)`);
    logger.info(`     ${GROQ_MODELS.LLAMA_33_70B} (~280 tps)`);
    logger.info(`     ${GROQ_MODELS.LLAMA_31_8B}  (~560 tps)`);
    logger.info('   PREVIEW (active, falls back to production if removed):');
    logger.info(`     ${GROQ_MODELS.KIMI_K2} (coding)`);
    logger.info(`     ${GROQ_MODELS.QWEN3_32B} (thinking)`);
    logger.info(`     ${GROQ_MODELS.LLAMA4_SCOUT} (vision)`);
  }

  // ── Pick model — use preview if not known-deprecated ────────
  private resolveModel(agentType: string): string {
    const primary  = AGENT_PRIMARY[agentType]  || this.defaultModel;
    const fallback = AGENT_FALLBACK[agentType] || GROQ_MODELS.LLAMA_33_70B;
    // If this preview model has already failed before, skip to fallback
    if (this.deprecatedModels.has(primary)) return fallback;
    return primary;
  }

  // ── Standard text chat ────────────────────────────────────
  async chat(
    messages: ChatMessage[],
    context?: string,
    options: GroqStreamOptions & { agentType?: string } = {}
  ): Promise<string> {
    const agentType = options.agentType || 'chat';
    const model = this.resolveModel(agentType);  // agentType always wins

    const key    = keyRotator.getKey();
    const client = new Groq({ apiKey: key });
    const system = (options.systemPrompt || BASE_SYSTEM_PROMPT) + (context || '');

    try {
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: options.temperature ?? 0.6,
        max_tokens:  options.maxTokens  ?? 8192,
      });
      keyRotator.reportSuccess(key);
      logger.debug(`[${agentType}] → ${model} ✓`);
      return res.choices[0]?.message?.content || '';

    } catch (err: unknown) {
      keyRotator.reportFailure(key);
      const errMsg = err instanceof Error ? err.message : String(err);

      // Detect deprecation/not-found errors for preview models
      const isModelGone = errMsg.includes('does not exist') ||
                          errMsg.includes('decommissioned') ||
                          errMsg.includes('deprecated') ||
                          errMsg.includes('404') ||
                          errMsg.includes('not found');

      if (isModelGone && PREVIEW_MODEL_IDS.has(model)) {
        logger.warn(`⚠️ Preview model ${model} appears removed — marking deprecated, falling back`);
        this.deprecatedModels.add(model);
        const fallback = AGENT_FALLBACK[agentType] || GROQ_MODELS.LLAMA_33_70B;
        const fk = keyRotator.getKey();
        const fc = new Groq({ apiKey: fk });
        const fb = await fc.chat.completions.create({
          model: fallback,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: options.temperature ?? 0.6,
          max_tokens:  options.maxTokens  ?? 8192,
        });
        keyRotator.reportSuccess(fk);
        logger.info(`[${agentType}] → fallback ${fallback} ✓`);
        return fb.choices[0]?.message?.content || '';
      }

      // Generic key failure — retry with next key
      logger.error(`chat error [${model}]:`, errMsg);
      if (model !== GROQ_MODELS.LLAMA_33_70B) {
        const fk = keyRotator.getKey();
        const fc = new Groq({ apiKey: fk });
        const fb = await fc.chat.completions.create({
          model: GROQ_MODELS.LLAMA_33_70B,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: options.temperature ?? 0.6,
          max_tokens:  options.maxTokens  ?? 8192,
        });
        keyRotator.reportSuccess(fk);
        return fb.choices[0]?.message?.content || '';
      }
      throw err;
    }
  }

  // ── Vision — Llama 4 Scout with production fallback ─────────
  async visionChat(messages: VisionMessage[], systemPrompt?: string): Promise<string> {
    const key    = keyRotator.getKey();
    const client = new Groq({ apiKey: key });
    const system = systemPrompt || BASE_SYSTEM_PROMPT;
    const model  = this.deprecatedModels.has(GROQ_MODELS.LLAMA4_SCOUT)
      ? GROQ_MODELS.LLAMA_33_70B
      : GROQ_MODELS.LLAMA4_SCOUT;

    try {
      // Cast messages array — VisionMessage is compatible with SDK param type
      const allMessages = [
        { role: 'system' as const, content: system },
        ...messages,
      ];
      const res = await client.chat.completions.create({
        model,
        messages: allMessages as Groq.Chat.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens:  8192,
      });
      keyRotator.reportSuccess(key);
      return res.choices[0]?.message?.content || '';
    } catch (err: unknown) {
      keyRotator.reportFailure(key);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isGone = errMsg.includes('does not exist') || errMsg.includes('decommissioned') ||
                     errMsg.includes('deprecated') || errMsg.includes('404');
      if (isGone) {
        logger.warn('⚠️ Llama 4 Scout removed — vision not available, using text fallback');
        this.deprecatedModels.add(GROQ_MODELS.LLAMA4_SCOUT);
        // Fallback: extract text content only and answer without image
        const textMessages: ChatMessage[] = messages.map((m) => ({
          role: m.role,
          content: (m.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join(' '),
        }));
        return this.chat(textMessages, undefined, { agentType: 'chat' });
      }
      throw err;
    }
  }

  // ── Streaming chat (always production for reliability) ──────
  async streamChat(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    context?: string,
    options: GroqStreamOptions & { agentType?: string } = {}
  ): Promise<string> {
    const key    = keyRotator.getKey();
    const client = new Groq({ apiKey: key });
    const system = (options.systemPrompt || BASE_SYSTEM_PROMPT) + (context || '');
    let full = '';

    try {
      const stream = await client.chat.completions.create({
        model: GROQ_MODELS.LLAMA_33_70B, // always production for streaming
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: options.temperature ?? 0.7,
        max_tokens:  options.maxTokens  ?? 8192,
        stream: true,
      });
      for await (const chunk of stream) {
        const d = chunk.choices[0]?.delta?.content || '';
        if (d) { full += d; onChunk(d); }
      }
      keyRotator.reportSuccess(key);
      return full;
    } catch (err) {
      keyRotator.reportFailure(key);
      const r = await this.chat(messages, context, options);
      onChunk(r);
      return r;
    }
  }

  // ── Agent completion ─────────────────────────────────────
  async agentComplete(
    agentPrompt: string,
    userMessage: string,
    context?: string,
    options: GroqStreamOptions & { agentType?: string } = {}
  ): Promise<string> {
    return this.chat(
      [{ role: 'user', content: userMessage }],
      context,
      { ...options, systemPrompt: agentPrompt + (context || '') }
    );
  }

  // ── JSON mode ────────────────────────────────────────────
  async jsonComplete(prompt: string, schema: string): Promise<Record<string, unknown>> {
    const r = await this.chat(
      [{ role: 'user', content: prompt }],
      undefined,
      { systemPrompt: `Return ONLY valid JSON matching: ${schema}. No markdown.`, temperature: 0.2, maxTokens: 2048 }
    );
    try { return JSON.parse(r.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()); }
    catch { return {}; }
  }

  async generateTitle(msg: string): Promise<string> {
    const r = await this.chat([{ role: 'user', content: msg }], undefined, {
      systemPrompt: 'Generate a short title (max 6 words). Return ONLY the title, no quotes.',
      temperature: 0.5, maxTokens: 20, agentType: 'chat',
    });
    return r.trim().slice(0, 60);
  }

  // ── Web Search via Groq Compound ─────────────────────────
  // groq/compound automatically decides when to search the web.
  // No extra API key needed — it uses Groq's built-in search tool.
  // Confirmed from official Groq docs: console.groq.com/docs/compound
  async webSearch(
    query: string,
    systemPrompt?: string
  ): Promise<{ response: string; usedSearch: boolean }> {
    const key    = keyRotator.getKey();
    const client = new Groq({ apiKey: key });
    const system = systemPrompt || BASE_SYSTEM_PROMPT;

    try {
      // stream: false ensures return type is ChatCompletion (not Stream)
      // so .choices is accessible without type narrowing
      const res = await client.chat.completions.create({
        model:      GROQ_MODELS.COMPOUND,
        messages:   [
          { role: 'system', content: system },
          { role: 'user',   content: query   },
        ],
        max_tokens: 4096,
        stream:     false,
      });

      keyRotator.reportSuccess(key);

      const message = res.choices[0]?.message;
      const response = message?.content || '';
      // Check if web search was actually used
      const usedSearch = !!(message as unknown as Record<string, unknown>)?.executed_tools;

      logger.info(`Compound search: usedSearch=${usedSearch}, chars=${response.length}`);
      return { response, usedSearch };

    } catch (err: unknown) {
      keyRotator.reportFailure(key);
      logger.error('webSearch error:', err);
      // Fallback to regular chat if compound fails
      const fallback = await this.chat(
        [{ role: 'user', content: query }],
        undefined,
        { agentType: 'chat', systemPrompt: system }
      );
      return { response: fallback, usedSearch: false };
    }
  }

  async healthCheck(): Promise<{ ok: boolean; models: Record<string, string> }> {
    try {
      await this.chat([{ role: 'user', content: 'Reply: OK' }], undefined,
        { maxTokens: 5, temperature: 0, agentType: 'chat' });
      return {
        ok: true,
        models: {
          production_primary:  GROQ_MODELS.GPT_OSS_120B,
          streaming:           GROQ_MODELS.LLAMA_33_70B,
          coding_preview:      this.deprecatedModels.has(GROQ_MODELS.KIMI_K2) ? 'DEPRECATED → ' + GROQ_MODELS.GPT_OSS_120B : GROQ_MODELS.KIMI_K2,
          vision_preview:      this.deprecatedModels.has(GROQ_MODELS.LLAMA4_SCOUT) ? 'DEPRECATED → text fallback' : GROQ_MODELS.LLAMA4_SCOUT,
          thinking_preview:    this.deprecatedModels.has(GROQ_MODELS.QWEN3_32B) ? 'DEPRECATED → ' + GROQ_MODELS.GPT_OSS_120B : GROQ_MODELS.QWEN3_32B,
        },
      };
    } catch { return { ok: false, models: {} }; }
  }

  getKeyStats()    { return keyRotator.getStats(); }
  getDefaultModel(){ return this.defaultModel; }
  getDeprecated()  { return [...this.deprecatedModels]; }
}

export const groqEngine = new GroqEngine();
