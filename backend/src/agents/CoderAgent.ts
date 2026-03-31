import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class CoderAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 CoderAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.coder, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'coder' });
    logger.info('✅ CoderAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'coder', output, durationMs: Date.now() - start };
  }
}
