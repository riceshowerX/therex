/**
 * 文档密码保护和加密存储
 * 使用 Web Crypto API 进行加密
 */

// 加密算法配置
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
}

/**
 * 从密码派生加密密钥
 */
async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // 导入密码作为原始密钥
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // 派生加密密钥
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密文本内容
 */
export async function encryptContent(content: string, password: string): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // 生成随机盐和 IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // 迭代次数（可根据性能调整）
  const iterations = 100000;
  
  // 派生密钥
  const key = await deriveKey(password, salt, iterations);
  
  // 加密
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  // 转换为 Base64
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  
  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    salt: saltBase64,
    iterations,
  };
}

/**
 * 解密内容
 */
export async function decryptContent(encrypted: EncryptedData, password: string): Promise<string> {
  // 从 Base64 解码
  const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(encrypted.salt), c => c.charCodeAt(0));
  
  // 派生密钥
  const key = await deriveKey(password, salt, encrypted.iterations);
  
  // 解密
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * 验证密码强度
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;
  
  // 长度检查
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  if (password.length < 8) {
    feedback.push('密码至少需要 8 个字符');
  }
  
  // 复杂度检查
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    feedback.push('建议同时包含大小写字母');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('建议包含数字');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('建议包含特殊字符');
  }
  
  // 常见弱密码检查
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 3);
    feedback.push('避免使用常见密码');
  }
  
  return {
    score: Math.min(5, score),
    feedback,
    isStrong: score >= 4 && password.length >= 8,
  };
}

/**
 * 生成随机密码
 */
export function generatePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // 确保每种字符都有
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // 打乱顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * 密码保护的文档存储
 */
export class SecureDocumentStorage {
  private static instance: SecureDocumentStorage;
  private storageKey = 'secure-documents';
  private masterPassword: string | null = null;
  private unlockedDocuments: Map<string, string> = new Map();
  
  static getInstance(): SecureDocumentStorage {
    if (!SecureDocumentStorage.instance) {
      SecureDocumentStorage.instance = new SecureDocumentStorage();
    }
    return SecureDocumentStorage.instance;
  }
  
  /**
   * 设置主密码
   */
  setMasterPassword(password: string): void {
    this.masterPassword = password;
  }
  
  /**
   * 清除主密码
   */
  clearMasterPassword(): void {
    this.masterPassword = null;
    this.unlockedDocuments.clear();
  }
  
  /**
   * 保存加密文档
   */
  async saveEncryptedDocument(documentId: string, content: string, password?: string): Promise<void> {
    const usePassword = password || this.masterPassword;
    if (!usePassword) {
      throw new Error('需要密码来加密文档');
    }
    
    const encrypted = await encryptContent(content, usePassword);
    
    // 存储到 localStorage
    const documents = this.loadDocumentIndex();
    documents[documentId] = {
      encrypted,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(documents));
    
    // 缓存解密内容
    this.unlockedDocuments.set(documentId, content);
  }
  
  /**
   * 加载解密文档
   */
  async loadDecryptedDocument(documentId: string, password?: string): Promise<string | null> {
    // 检查缓存
    if (this.unlockedDocuments.has(documentId)) {
      return this.unlockedDocuments.get(documentId) || null;
    }
    
    const usePassword = password || this.masterPassword;
    if (!usePassword) {
      return null;
    }
    
    const documents = this.loadDocumentIndex();
    const doc = documents[documentId];
    
    if (!doc) {
      return null;
    }
    
    try {
      const content = await decryptContent(doc.encrypted, usePassword);
      this.unlockedDocuments.set(documentId, content);
      return content;
    } catch {
      return null;
    }
  }
  
  /**
   * 删除加密文档
   */
  deleteEncryptedDocument(documentId: string): void {
    const documents = this.loadDocumentIndex();
    delete documents[documentId];
    localStorage.setItem(this.storageKey, JSON.stringify(documents));
    this.unlockedDocuments.delete(documentId);
  }
  
  /**
   * 检查文档是否加密
   */
  isDocumentEncrypted(documentId: string): boolean {
    const documents = this.loadDocumentIndex();
    return !!documents[documentId];
  }
  
  /**
   * 锁定文档（清除缓存）
   */
  lockDocument(documentId: string): void {
    this.unlockedDocuments.delete(documentId);
  }
  
  /**
   * 锁定所有文档
   */
  lockAllDocuments(): void {
    this.unlockedDocuments.clear();
  }
  
  /**
   * 获取所有加密文档 ID
   */
  getEncryptedDocumentIds(): string[] {
    const documents = this.loadDocumentIndex();
    return Object.keys(documents);
  }
  
  /**
   * 加载文档索引
   */
  private loadDocumentIndex(): Record<string, { encrypted: EncryptedData; timestamp: number }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}

// 导出单例
export const secureStorage = SecureDocumentStorage.getInstance();
