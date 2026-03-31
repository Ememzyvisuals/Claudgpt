import { memoryService } from '../services/memory.service';
import { projectService } from '../services/project.service';
import { supabaseService } from '../services/supabase.service';
import { logger } from '../utils/logger';
import type { AgentTask, AgentResult, AgentType } from '../types';
import { PlannerAgent } from './PlannerAgent';
import { ArchitectAgent } from './ArchitectAgent';
import { CoderAgent } from './CoderAgent';
import { DebuggerAgent } from './DebuggerAgent';
import { ReviewerAgent } from './ReviewerAgent';
import { ToolAgent } from './ToolAgent';
import { MemoryAgent } from './MemoryAgent';
import { SearchAgent } from './SearchAgent';
import { ExportAgent } from './ExportAgent';

export class AgentOrchestrator {
  static async run(task: AgentTask): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    logger.info(`🤖 Orchestrator task ${task.taskId}`);
    try {
      await supabaseService.getAdminClient().from('agent_tasks').insert({ id: task.taskId, user_id: task.userId, project_id: task.projectId || null, agent_type: 'orchestrator', status: 'running', input: { prompt: task.prompt }, started_at: new Date().toISOString() });
      const memCtx = await memoryService.buildContextString(task.userId, task.projectId);
      if (task.mode === 'full') {
        const plan = await PlannerAgent.run(task.prompt, memCtx); results.push(plan);
        const arch = await ArchitectAgent.run(`${task.prompt}\n\nPlan:\n${plan.output}`, memCtx); results.push(arch);
        const code = await CoderAgent.run(`${task.prompt}\n\nPlan:\n${plan.output}\n\nArch:\n${arch.output}`, memCtx); results.push(code);
        const review = await ReviewerAgent.run(code.output, memCtx); results.push(review);
        if (task.projectId && code.files?.length) await projectService.saveGeneratedFiles(task.projectId, code.files);
      }
      await supabaseService.getAdminClient().from('agent_tasks').update({ status: 'complete', completed_at: new Date().toISOString() }).eq('id', task.taskId);
      return results;
    } catch (err) {
      await supabaseService.getAdminClient().from('agent_tasks').update({ status: 'failed', error: err instanceof Error ? err.message : 'Unknown', completed_at: new Date().toISOString() }).eq('id', task.taskId);
      throw err;
    }
  }
  static async runSingleAgent(agentType: AgentType, prompt: string, userId: string, context?: string): Promise<string> {
    const memCtx = await memoryService.buildContextString(userId);
    const ctx = [memCtx, context].filter(Boolean).join('\n\n');
    const agents: Record<AgentType, () => Promise<AgentResult>> = {
      planner: () => PlannerAgent.run(prompt, ctx), architect: () => ArchitectAgent.run(prompt, ctx),
      coder: () => CoderAgent.run(prompt, ctx), debugger: () => DebuggerAgent.run(prompt, ctx),
      reviewer: () => ReviewerAgent.run(prompt, ctx), tool: () => ToolAgent.run(prompt, ctx),
      memory: () => MemoryAgent.run(prompt, ctx), search: () => SearchAgent.run(prompt, ctx),
      export: () => ExportAgent.run(prompt, ctx),
    };
    const result = await (agents[agentType] || agents.coder)();
    return result.output;
  }
}
