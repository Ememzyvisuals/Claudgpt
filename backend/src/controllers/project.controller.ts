import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseService } from '../services/supabase.service';
import { createError } from '../middleware/error.middleware';
class ProjectController {
  async createProject(req: AuthRequest, res: Response, next: NextFunction) { try { const { name, description, type } = req.body; if (!name) throw createError('Name required', 400); const p = await supabaseService.createProject(req.user!.id, name, description || '', type || 'web'); res.status(201).json({ project: p }); } catch (e) { next(e); } }
  async getProjects(req: AuthRequest, res: Response, next: NextFunction) { try { const p = await supabaseService.getProjects(req.user!.id); res.json({ projects: p }); } catch (e) { next(e); } }
  async getProject(req: AuthRequest, res: Response, next: NextFunction) { try { const p = await supabaseService.getProjectById(req.params.projectId, req.user!.id); res.json({ project: p }); } catch (e) { next(e); } }
  async updateProject(req: AuthRequest, res: Response, next: NextFunction) { try { const p = await supabaseService.updateProject(req.params.projectId, req.user!.id, req.body); res.json({ project: p }); } catch (e) { next(e); } }
  async deleteProject(req: AuthRequest, res: Response, next: NextFunction) { try { await supabaseService.deleteProject(req.params.projectId, req.user!.id); res.json({ message: 'Deleted' }); } catch (e) { next(e); } }
  async getFiles(req: AuthRequest, res: Response, next: NextFunction) { try { const f = await supabaseService.getProjectFiles(req.params.projectId); res.json({ files: f }); } catch (e) { next(e); } }
  async saveFile(req: AuthRequest, res: Response, next: NextFunction) { try { const { filePath, content, language } = req.body; if (!filePath || !content) throw createError('filePath and content required', 400); const f = await supabaseService.saveProjectFile(req.params.projectId, filePath, content, language || 'text'); res.json({ file: f }); } catch (e) { next(e); } }
}
export const projectController = new ProjectController();
