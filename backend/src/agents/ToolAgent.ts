import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class ToolAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 ToolAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.tool, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'tool' });
    logger.info('✅ ToolAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'tool', output, durationMs: Date.now() - start };
  }
}
