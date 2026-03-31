import { supabaseService } from './supabase.service';
import { logger } from '../utils/logger';
interface Memory { type: 'fact' | 'preference' | 'context' | 'code' | 'summary'; content: string; tags?: string[]; importance?: number; projectId?: string; }
class MemoryService {
  async save(userId: string, memory: Memory): Promise<void> {
    try { await supabaseService.getAdminClient().from('memories').insert({ user_id: userId, project_id: memory.projectId || null, type: memory.type, content: memory.content, tags: memory.tags || [], importance: memory.importance || 5 }); }
    catch (err) { logger.error('Memory save failed:', err); }
  }
  async retrieve(userId: string, options?: { projectId?: string; limit?: number }): Promise<unknown[]> {
    try {
      let query = supabaseService.getAdminClient().from('memories').select('*').eq('user_id', userId).order('importance', { ascending: false }).limit(options?.limit || 20);
      if (options?.projectId) query = query.eq('project_id', options.projectId);
      const { data, error } = await query; if (error) throw error; return data || [];
    } catch (err) { logger.error('Memory retrieve failed:', err); return []; }
  }
  async buildContextString(userId: string, projectId?: string): Promise<string> {
    const memories = await this.retrieve(userId, { projectId, limit: 10 });
    if (!memories.length) return '';
    return '\n\n--- USER MEMORY CONTEXT ---\n' + (memories as Array<{ type: string; content: string }>).map(m => `[${m.type.toUpperCase()}] ${m.content}`).join('\n') + '\n---\n';
  }
  async logToolCall(toolName: string, input: Record<string, unknown>, output: Record<string, unknown>, success: boolean, durationMs: number, sessionId?: string): Promise<void> {
    try { await supabaseService.getAdminClient().from('tool_calls').insert({ tool_name: toolName, input, output, success, duration_ms: durationMs, session_id: sessionId || null }); }
    catch (err) { logger.error('Tool call log failed:', err); }
  }
}
export const memoryService = new MemoryService();
