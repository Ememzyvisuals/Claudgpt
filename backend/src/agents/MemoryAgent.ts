import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class MemoryAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 MemoryAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.memory, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'memory' });
    logger.info('✅ MemoryAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'memory', output, durationMs: Date.now() - start };
  }
}
