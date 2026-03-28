import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class ArchitectAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 ArchitectAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.architect, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'architect' });
    logger.info('✅ ArchitectAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'architect', output, durationMs: Date.now() - start };
  }
}
