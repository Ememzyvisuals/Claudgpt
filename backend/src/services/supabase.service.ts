import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
class SupabaseService {
  private client: SupabaseClient;
  adminClient: SupabaseClient;
  constructor() {
    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !anonKey || !serviceKey) { logger.error('Missing Supabase env vars'); process.exit(1); }
    this.client = createClient(url, anonKey);
    this.adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    logger.info('✅ Supabase initialized');
  }
  getClient() { return this.client; }
  getAdminClient() { return this.adminClient; }
  async verifyToken(token: string) {
    return this.adminClient.auth.getUser(token);
  }

  async getUserById(userId: string) { const { data, error } = await this.adminClient.from('profiles').select('*').eq('id', userId).single(); if (error) throw error; return data; }
  async createChatSession(userId: string, title: string) { const { data, error } = await this.adminClient.from('chat_sessions').insert({ user_id: userId, title }).select().single(); if (error) throw error; return data; }
  async getChatSessions(userId: string) { const { data, error } = await this.adminClient.from('chat_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) throw error; return data; }
  async updateSessionTitle(sessionId: string, title: string) {
    const { error } = await this.adminClient
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) logger.warn('updateSessionTitle error:', error);
  }

  async deleteChatSession(sessionId: string, userId: string) { const { error } = await this.adminClient.from('chat_sessions').delete().eq('id', sessionId).eq('user_id', userId); if (error) throw error; }
  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, unknown>) { const { data, error } = await this.adminClient.from('messages').insert({ session_id: sessionId, role, content, metadata }).select().single(); if (error) throw error; return data; }
  async getMessages(sessionId: string, limit = 50) { const { data, error } = await this.adminClient.from('messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }).limit(limit); if (error) throw error; return data; }
  async createProject(userId: string, name: string, description: string, type: string) { const { data, error } = await this.adminClient.from('projects').insert({ user_id: userId, name, description, type, status: 'active' }).select().single(); if (error) throw error; return data; }
  async getProjects(userId: string) { const { data, error } = await this.adminClient.from('projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false }); if (error) throw error; return data; }
  async getProjectById(projectId: string, userId: string) { const { data, error } = await this.adminClient.from('projects').select('*, project_files(*)').eq('id', projectId).eq('user_id', userId).single(); if (error) throw error; return data; }
  async updateProject(projectId: string, userId: string, updates: Record<string, unknown>) { const { data, error } = await this.adminClient.from('projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', projectId).eq('user_id', userId).select().single(); if (error) throw error; return data; }
  async deleteProject(projectId: string, userId: string) { const { error } = await this.adminClient.from('projects').delete().eq('id', projectId).eq('user_id', userId); if (error) throw error; }
  async saveProjectFile(projectId: string, filePath: string, content: string, language: string) { const { data, error } = await this.adminClient.from('project_files').upsert({ project_id: projectId, file_path: filePath, content, language }, { onConflict: 'project_id,file_path' }).select().single(); if (error) throw error; return data; }
  async getProjectFiles(projectId: string) { const { data, error } = await this.adminClient.from('project_files').select('*').eq('project_id', projectId).order('file_path', { ascending: true }); if (error) throw error; return data; }
}
export const supabaseService = new SupabaseService();
