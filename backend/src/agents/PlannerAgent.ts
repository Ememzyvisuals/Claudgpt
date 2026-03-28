import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class PlannerAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 PlannerAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.planner, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'planner' });
    logger.info('✅ PlannerAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'planner', output, durationMs: Date.now() - start };
  }
}
