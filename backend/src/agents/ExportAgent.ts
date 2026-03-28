import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class ExportAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 ExportAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.export, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'export' });
    logger.info('✅ ExportAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'export', output, durationMs: Date.now() - start };
  }
}
