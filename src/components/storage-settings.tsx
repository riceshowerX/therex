'use client';

/**
 * 存储设置组件
 *
 * 允许用户选择和配置存储后端
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  HardDrive,
  Cloud,
  Server,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getStorageManager,
  type StorageProvider,
  type StorageConfig,
  type LocalStorageConfig,
  type IndexedDBStorageConfig,
  type SupabaseStorageConfig,
} from '@/lib/storage';

// 存储提供商配置
const STORAGE_PROVIDERS: Record<StorageProvider, {
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  limitations: string[];
}> = {
  local: {
    name: '本地存储 (localStorage)',
    description: '数据存储在浏览器中，无需配置',
    icon: <HardDrive className="h-5 w-5" />,
    features: ['无需配置', '完全离线', '零成本'],
    limitations: ['仅当前浏览器', '容量有限 (~5MB)', '无法跨设备同步'],
  },
  indexeddb: {
    name: '本地数据库 (IndexedDB)',
    description: '大容量本地存储，适合大量文档',
    icon: <Database className="h-5 w-5" />,
    features: ['大容量存储', '完全离线', '零成本', '高效索引'],
    limitations: ['仅当前浏览器', '无法跨设备同步'],
  },
  supabase: {
    name: 'Supabase 云数据库',
    description: '云端 PostgreSQL，支持跨设备同步',
    icon: <Cloud className="h-5 w-5" />,
    features: ['云端存储', '跨设备同步', '大容量', '支持多用户'],
    limitations: ['需要 Supabase 账号', '需要网络连接', '有免费额度限制'],
  },
  postgresql: {
    name: 'PostgreSQL 数据库',
    description: '连接自建 PostgreSQL 数据库',
    icon: <Server className="h-5 w-5" />,
    features: ['完全控制', '无限制', '可自托管'],
    limitations: ['需要自行搭建数据库', '需要技术知识'],
  },
  mongodb: {
    name: 'MongoDB 数据库',
    description: '连接 MongoDB 数据库',
    icon: <Database className="h-5 w-5" />,
    features: ['文档存储', '灵活模式', '高性能'],
    limitations: ['需要自行搭建数据库', '需要技术知识'],
  },
};

export function StorageSettings() {
  const [currentProvider, setCurrentProvider] = useState<StorageProvider>('local');
  const [isTesting, setIsTesting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<StorageConfig | null>(null);
  const [migrationProgress, setMigrationProgress] = useState(0);

  // 配置表单状态
  const [supabaseConfig, setSupabaseConfig] = useState({
    url: '',
    anonKey: '',
    serviceRoleKey: '',
  });

  const [indexedDBConfig, setIndexedDBConfig] = useState({
    dbName: 'therex-db',
  });

  // 加载当前配置
  useEffect(() => {
    const manager = getStorageManager();
    const provider = manager.getConfig();
    setCurrentProvider(provider);
    // 配置详细信息需要用户重新输入或从其他地方加载
  }, []);

  // 切换存储提供商
  const handleProviderChange = (provider: StorageProvider) => {
    setCurrentProvider(provider);
  };

  // 测试连接
  const handleTestConnection = async () => {
    setIsTesting(true);

    try {
      const config = buildConfig();
      if (!config) {
        toast.error('请填写完整的配置信息');
        return;
      }

      const manager = getStorageManager();
      
      // 创建临时适配器测试
      let testSuccess = false;
      
      if (config.provider === 'local') {
        testSuccess = true; // localStorage 总是可用
      } else if (config.provider === 'indexeddb') {
        // 测试 IndexedDB 可用性
        testSuccess = typeof indexedDB !== 'undefined';
      } else if (config.provider === 'supabase') {
        const sc = config as SupabaseStorageConfig;
        // 简单验证 URL 格式
        testSuccess = sc.url.startsWith('http') && sc.anonKey.length > 20;
      }

      if (testSuccess) {
        toast.success('配置验证通过');
      } else {
        toast.error('配置验证失败，请检查配置信息');
      }
    } catch (error) {
      toast.error('测试连接失败');
    } finally {
      setIsTesting(false);
    }
  };

  // 构建配置对象
  const buildConfig = (): StorageConfig | null => {
    switch (currentProvider) {
      case 'local':
        return { provider: 'local', prefix: 'therex' } as LocalStorageConfig;
      
      case 'indexeddb':
        if (!indexedDBConfig.dbName) return null;
        return {
          provider: 'indexeddb',
          dbName: indexedDBConfig.dbName,
        } as IndexedDBStorageConfig;
      
      case 'supabase':
        if (!supabaseConfig.url || !supabaseConfig.anonKey) return null;
        return {
          provider: 'supabase',
          url: supabaseConfig.url,
          anonKey: supabaseConfig.anonKey,
          serviceRoleKey: supabaseConfig.serviceRoleKey,
        } as SupabaseStorageConfig;
      
      default:
        return null;
    }
  };

  // 保存配置并迁移数据
  const handleSave = async () => {
    const config = buildConfig();
    if (!config) {
      toast.error('请填写完整的配置信息');
      return;
    }

    setPendingConfig(config);
    setShowMigrateDialog(true);
  };

  // 执行迁移
  const handleMigrate = async () => {
    if (!pendingConfig) return;

    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      const manager = getStorageManager();
      
      // 模拟进度
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await manager.migrateTo(pendingConfig.provider, pendingConfig);
      
      clearInterval(progressInterval);
      setMigrationProgress(100);

      if (result.failed === 0) {
        toast.success(`存储已切换，成功迁移 ${result.success} 条数据`);
      } else {
        toast.warning(`迁移完成：${result.success} 成功，${result.failed} 失败`);
      }

      setShowMigrateDialog(false);
    } catch (error) {
      toast.error('迁移失败，请重试');
    } finally {
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  };

  // 渲染配置表单
  const renderConfigForm = () => {
    switch (currentProvider) {
      case 'local':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              本地存储模式无需额外配置。数据将存储在浏览器的 localStorage 中。
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">注意事项：</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• 数据仅保存在当前浏览器中</li>
                <li>• 清除浏览器数据会导致数据丢失</li>
                <li>• 建议定期导出备份</li>
              </ul>
            </div>
          </div>
        );

      case 'indexeddb':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dbName">数据库名称</Label>
              <Input
                id="dbName"
                value={indexedDBConfig.dbName}
                onChange={(e) => setIndexedDBConfig({ ...indexedDBConfig, dbName: e.target.value })}
                placeholder="therex-db"
              />
              <p className="text-xs text-muted-foreground">
                数据库名称用于区分不同的数据存储
              </p>
            </div>
          </div>
        );

      case 'supabase':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <Input
                id="supabaseUrl"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                placeholder="https://your-project.supabase.co"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anonKey">Anon Key (公钥)</Label>
              <Input
                id="anonKey"
                type="password"
                value={supabaseConfig.anonKey}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceRoleKey">Service Role Key (可选)</Label>
              <Input
                id="serviceRoleKey"
                type="password"
                value={supabaseConfig.serviceRoleKey}
                onChange={(e) => setSupabaseConfig({ ...supabaseConfig, serviceRoleKey: e.target.value })}
                placeholder="用于服务端操作，可选"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              在 Supabase 控制台的 Settings → API 中获取这些信息
            </p>
          </div>
        );

      case 'postgresql':
      case 'mongodb':
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              此存储后端即将推出
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              PostgreSQL 和 MongoDB 适配器正在开发中，敬请期待。
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const currentProviderInfo = STORAGE_PROVIDERS[currentProvider];

  return (
    <div className="space-y-6">
      {/* 存储提供商选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            存储后端
          </CardTitle>
          <CardDescription>
            选择数据存储方式。您可以随时切换存储后端，数据会自动迁移。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(STORAGE_PROVIDERS) as [StorageProvider, typeof STORAGE_PROVIDERS[StorageProvider]][]).map(
              ([key, info]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    currentProvider === key
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  } ${(key === 'postgresql' || key === 'mongodb') ? 'opacity-50' : ''}`}
                  onClick={() => {
                    if (key !== 'postgresql' && key !== 'mongodb') {
                      handleProviderChange(key);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary">{info.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {info.name}
                        {currentProvider === key && (
                          <Badge variant="default" className="text-xs">当前</Badge>
                        )}
                        {(key === 'postgresql' || key === 'mongodb') && (
                          <Badge variant="outline" className="text-xs">即将推出</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* 当前提供商详情 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentProviderInfo.icon}
            {currentProviderInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 特性和限制 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">优点</p>
              <ul className="text-sm space-y-1">
                {currentProviderInfo.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">限制</p>
              <ul className="text-sm space-y-1">
                {currentProviderInfo.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            {renderConfigForm()}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            {currentProvider !== 'local' && currentProvider !== 'postgresql' && currentProvider !== 'mongodb' && (
              <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                测试连接
              </Button>
            )}
            <Button onClick={handleSave} disabled={currentProvider === 'postgresql' || currentProvider === 'mongodb'}>
              <ArrowRight className="h-4 w-4 mr-2" />
              切换并迁移数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 迁移确认对话框 */}
      <AlertDialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认切换存储</AlertDialogTitle>
            <AlertDialogDescription>
              切换存储后端会将所有数据迁移到新的存储位置。请确保数据已备份。
              <br /><br />
              当前的数据将被复制到新存储，原数据不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isMigrating && (
            <div className="py-4">
              <Progress value={migrationProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                正在迁移数据... {migrationProgress}%
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMigrating}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleMigrate} disabled={isMigrating}>
              {isMigrating ? '迁移中...' : '确认迁移'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
