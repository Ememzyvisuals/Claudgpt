import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

export class DebuggerAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();
    logger.info('🤖 DebuggerAgent running...');
    const output = await groqEngine.agentComplete(AGENT_PROMPTS.debugger, prompt, context, { temperature: 0.6, maxTokens: 8192, agentType: 'debugger' });
    logger.info('✅ DebuggerAgent complete in ' + (Date.now() - start) + 'ms');
    return { agentType: 'debugger', output, durationMs: Date.now() - start };
  }
}
