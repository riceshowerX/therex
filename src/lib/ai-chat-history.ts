/**
 * AI 对话历史管理器
 * 保存和管理 AI 对话历史，支持跨会话持久化
 */

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface AIChatSession {
  id: string;
  title: string;
  documentId?: string;
  documentTitle?: string;
  messages: AIChatMessage[];
  createdAt: number;
  updatedAt: number;
  provider: string;
  model: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
}

const STORAGE_KEY = 'ai-chat-sessions';
const MAX_SESSIONS = 100;
const MAX_MESSAGES_PER_SESSION = 200;

class AIChatHistory {
  private sessions: AIChatSession[] = [];
  private currentSessionId: string | null = null;
  
  constructor() {
    this.loadSessions();
  }
  
  private loadSessions(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.sessions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load AI chat sessions:', error);
      this.sessions = [];
    }
  }
  
  private saveSessions(): void {
    if (typeof window === 'undefined') return;
    try {
      // 清理旧会话
      if (this.sessions.length > MAX_SESSIONS) {
        // 保留置顶和最近的会话
        const pinned = this.sessions.filter(s => s.isPinned);
        const unpinned = this.sessions.filter(s => !s.isPinned);
        const toKeep = unpinned.slice(-(MAX_SESSIONS - pinned.length));
        this.sessions = [...pinned, ...toKeep];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Failed to save AI chat sessions:', error);
    }
  }
  
  /**
   * 创建新会话
   */
  createSession(params: {
    documentId?: string;
    documentTitle?: string;
    provider?: string;
    model?: string;
  }): AIChatSession {
    const session: AIChatSession = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: params.documentTitle || '新对话',
      documentId: params.documentId,
      documentTitle: params.documentTitle,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider: params.provider || 'unknown',
      model: params.model || 'unknown',
      isPinned: false,
      isArchived: false,
      tags: [],
    };
    
    this.sessions.unshift(session);
    this.currentSessionId = session.id;
    this.saveSessions();
    
    return session;
  }
  
  /**
   * 获取当前会话
   */
  getCurrentSession(): AIChatSession | null {
    if (!this.currentSessionId) return null;
    return this.getSession(this.currentSessionId);
  }
  
  /**
   * 设置当前会话
   */
  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }
  
  /**
   * 获取会话
   */
  getSession(sessionId: string): AIChatSession | null {
    return this.sessions.find(s => s.id === sessionId) || null;
  }
  
  /**
   * 获取所有会话
   */
  getAllSessions(options?: {
    includeArchived?: boolean;
    documentId?: string;
  }): AIChatSession[] {
    let result = this.sessions;
    
    if (!options?.includeArchived) {
      result = result.filter(s => !s.isArchived);
    }
    
    if (options?.documentId) {
      result = result.filter(s => s.documentId === options.documentId);
    }
    
    // 按置顶和更新时间排序
    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }
  
  /**
   * 添加消息到会话
   */
  addMessage(sessionId: string, message: Omit<AIChatMessage, 'id' | 'timestamp'>): AIChatMessage | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const fullMessage: AIChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: message.role,
      content: message.content,
      timestamp: Date.now(),
      tokens: message.tokens,
    };
    
    session.messages.push(fullMessage);
    session.updatedAt = Date.now();
    
    // 限制消息数量
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }
    
    // 自动更新标题（使用第一条用户消息）
    if (message.role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }
    
    this.saveSessions();
    return fullMessage;
  }
  
  /**
   * 删除消息
   */
  deleteMessage(sessionId: string, messageId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    const index = session.messages.findIndex(m => m.id === messageId);
    if (index === -1) return false;
    
    session.messages.splice(index, 1);
    session.updatedAt = Date.now();
    this.saveSessions();
    return true;
  }
  
  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<AIChatSession>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    Object.assign(session, updates, { updatedAt: Date.now() });
    this.saveSessions();
    return true;
  }
  
  /**
   * 置顶/取消置顶会话
   */
  togglePin(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    session.isPinned = !session.isPinned;
    session.updatedAt = Date.now();
    this.saveSessions();
    return true;
  }
  
  /**
   * 归档/取消归档会话
   */
  toggleArchive(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    session.isArchived = !session.isArchived;
    session.updatedAt = Date.now();
    this.saveSessions();
    return true;
  }
  
  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;
    
    this.sessions.splice(index, 1);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = this.sessions[0]?.id || null;
    }
    this.saveSessions();
    return true;
  }
  
  /**
   * 搜索会话
   */
  searchSessions(query: string): AIChatSession[] {
    const lowerQuery = query.toLowerCase();
    return this.sessions.filter(session => 
      session.title.toLowerCase().includes(lowerQuery) ||
      session.messages.some(m => m.content.toLowerCase().includes(lowerQuery)) ||
      session.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }
  
  /**
   * 清除所有会话
   */
  clearAllSessions(): void {
    this.sessions = [];
    this.currentSessionId = null;
    this.saveSessions();
  }
  
  /**
   * 导出会话
   */
  exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return JSON.stringify(session, null, 2);
  }
  
  /**
   * 导入会话
   */
  importSession(json: string): AIChatSession | null {
    try {
      const session = JSON.parse(json) as AIChatSession;
      if (session.id && session.messages) {
        session.id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        session.createdAt = Date.now();
        session.updatedAt = Date.now();
        this.sessions.unshift(session);
        this.saveSessions();
        return session;
      }
      return null;
    } catch {
      return null;
    }
  }
}

// 单例导出
export const aiChatHistory = new AIChatHistory();
