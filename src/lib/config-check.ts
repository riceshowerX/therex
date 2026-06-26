/**
 * 生产环境配置检查
 */

interface ConfigCheck {
  name: string;
  required: boolean;
  check: () => boolean;
  message: string;
}

const configChecks: ConfigCheck[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    check: () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return !!url && url.startsWith('http');
    },
    message: 'Supabase URL 必须配置且以 http(s):// 开头',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    check: () => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      return !!key && key.length > 20;
    },
    message: 'Supabase 匿名密钥必须配置',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    check: () => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      return !!key && key.length > 20;
    },
    message: 'Supabase 服务端密钥建议配置（用于服务端操作）',
  },
  {
    name: 'AI_API_KEY',
    required: false,
    check: () => {
      const key = process.env.AI_API_KEY;
      return !!key && key.length > 10;
    },
    message: 'AI API 密钥可选配置（也可在前端设置页面配置）',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    check: () => {
      const url = process.env.NEXT_PUBLIC_APP_URL;
      return !!url && url.startsWith('http');
    },
    message: '应用 URL 建议配置（用于生成分享链接）',
  },
];

/**
 * 检查生产环境配置
 */
export function checkProductionConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查是否为生产环境
  const isProduction = process.env.NODE_ENV === 'production';

  for (const config of configChecks) {
    const isValid = config.check();

    if (!isValid) {
      if (config.required) {
        errors.push(`[${config.name}] ${config.message}`);
      } else if (isProduction) {
        warnings.push(`[${config.name}] ${config.message}`);
      }
    }
  }

  // 生产环境额外检查
  if (isProduction) {
    // 检查是否使用了默认值
    if (process.env.NEXT_PUBLIC_APP_NAME === 'Therex') {
      warnings.push('[NEXT_PUBLIC_APP_NAME] 使用了默认值，建议修改为您的应用名称');
    }

    // 检查 APP URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl?.includes('localhost') || appUrl?.includes('127.0.0.1')) {
      warnings.push('[NEXT_PUBLIC_APP_URL] 使用了本地地址，建议修改为实际域名');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 获取配置状态（用于前端显示）
 */
export function getConfigStatus(): {
  hasDatabase: boolean;
  hasAI: boolean;
  isProduction: boolean;
} {
  return {
    hasDatabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasAI: !!(process.env.AI_API_KEY),
    isProduction: process.env.NODE_ENV === 'production',
  };
}

/**
 * 初始化时检查配置
 */
export function initConfigCheck(): void {
  if (typeof window === 'undefined') {
    const result = checkProductionConfig();

    if (result.errors.length > 0) {
      console.error('\n❌ 配置检查失败:\n');
      result.errors.forEach(err => console.error(`  - ${err}`));
      console.error('\n请检查 .env.local 文件中的配置\n');
    }

    if (result.warnings.length > 0) {
      console.warn('\n⚠️ 配置警告:\n');
      result.warnings.forEach(warn => console.warn(`  - ${warn}`));
      console.warn('');
    }

    if (result.valid && result.warnings.length === 0) {
      console.log('\n✅ 配置检查通过\n');
    }
  }
}
