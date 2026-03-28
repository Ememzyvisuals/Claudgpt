import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class ReviewerAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 ReviewerAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.reviewer, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'reviewer' });
    logger.info('✅ ReviewerAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'reviewer', output, durationMs: Date.now() - start };
  }
}
