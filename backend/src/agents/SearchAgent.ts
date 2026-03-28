import { groqEngine } from '../engine/GroqEngine';
import { AGENT_PROMPTS } from './prompts';
import { logger } from '../utils/logger';
import type { AgentResult } from '../types';

/**
 * SearchAgent — uses Groq Compound's built-in web search.
 * No external search API needed. groq/compound automatically
 * searches the web when the query requires current information.
 * Confirmed from: console.groq.com/docs/compound
 */
export class SearchAgent {
  static async run(prompt: string, context?: string): Promise<AgentResult> {
    const start = Date.now();

    logger.info(`SearchAgent: querying with web search enabled`);

    // Use groq/compound which has built-in web search
    // It automatically decides whether to search based on the query
    const systemWithContext = AGENT_PROMPTS.search + (context ? `\n\n${context}` : '');

    const { response, usedSearch } = await groqEngine.webSearch(prompt, systemWithContext);

    logger.info(`SearchAgent: complete (webSearchUsed=${usedSearch})`);

    return {
      agentType:  'search',
      output:     response,
      metadata:   { usedWebSearch: usedSearch },
      durationMs: Date.now() - start,
    };
  }
}
