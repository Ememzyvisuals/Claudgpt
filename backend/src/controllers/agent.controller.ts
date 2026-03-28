import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
const taskRegistry = new Map<string, { status: string; result?: unknown; error?: string }>();
class AgentController {
  async runAgentPipeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { prompt, projectId, mode } = req.body;
      if (!prompt) throw createError('Prompt required', 400);
      const taskId = uuidv4();
      taskRegistry.set(taskId, { status: 'running' });
      AgentOrchestrator.run({ taskId, prompt, userId: req.user!.id, projectId, mode: mode || 'full' }).then(r => taskRegistry.set(taskId, { status: 'complete', result: r })).catch((e: Error) => taskRegistry.set(taskId, { status: 'failed', error: e.message }));
      res.status(202).json({ taskId, status: 'running' });
    } catch (err) { next(err); }
  }
  async runPlanner(req: AuthRequest, res: Response, next: NextFunction) { try { const r = await AgentOrchestrator.runSingleAgent('planner', req.body.prompt, req.user!.id); res.json({ result: r }); } catch (e) { next(e); } }
  async runCoder(req: AuthRequest, res: Response, next: NextFunction) { try { const r = await AgentOrchestrator.runSingleAgent('coder', req.body.prompt, req.user!.id, req.body.context); res.json({ result: r }); } catch (e) { next(e); } }
  async runDebugger(req: AuthRequest, res: Response, next: NextFunction) { try { const { code, error, language } = req.body; const r = await AgentOrchestrator.runSingleAgent('debugger', `Debug this ${language || 'code'}:\n${code}\nError: ${error || 'unknown'}`, req.user!.id); res.json({ result: r }); } catch (e) { next(e); } }
  async runReviewer(req: AuthRequest, res: Response, next: NextFunction) { try { const r = await AgentOrchestrator.runSingleAgent('reviewer', `Review:\n${req.body.code}`, req.user!.id); res.json({ result: r }); } catch (e) { next(e); } }
  async getTaskStatus(req: AuthRequest, res: Response, next: NextFunction) { try { const task = taskRegistry.get(req.params.taskId); if (!task) throw createError('Task not found', 404); res.json({ taskId: req.params.taskId, ...task }); } catch (e) { next(e); } }
}
export const agentController = new AgentController();
