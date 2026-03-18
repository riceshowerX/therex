'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Settings2,
  Key,
  Server,
  Cpu,
  MessageSquare,
  TestTube,
  Loader2,
  Globe,
  Download,
  Smartphone,
  Wifi,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiConfigManager,
  type AIConfig,
  type AIProvider,
  providerPresets,
} from '@/lib/ai-config';
import { StorageSettings } from '@/components/storage-settings';
import { useI18n } from '@/lib/i18n';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, mounted: i18nMounted } = useI18n();
  const { canInstall, isInstalled, isSupported, install } = usePWAInstall();
  
  // 客户端挂载状态
  const [mounted, setMounted] = useState(false);
  
  // AI 配置状态
  const [config, setConfig] = useState<AIConfig>(aiConfigManager.getConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  
  // 编辑器设置
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [autoSave, setAutoSave] = useState(true);

  // 加载设置
  useEffect(() => {
    setMounted(true);
    const savedFontSize = localStorage.getItem('editor-font-size');
    if (savedFontSize) {
      setEditorFontSize(parseInt(savedFontSize));
    }
    
    const savedAutoSave = localStorage.getItem('editor-auto-save');
    if (savedAutoSave !== null) {
      setAutoSave(savedAutoSave === 'true');
    }
  }, []);

  // 保存 AI 配置
  const handleSaveConfig = () => {
    aiConfigManager.saveConfig(config);
    toast.success('AI 配置已保存');
  };

  // 重置配置
  const handleResetConfig = () => {
    aiConfigManager.resetConfig();
    setConfig(aiConfigManager.getConfig());
    toast.success('配置已重置');
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!config.apiKey) {
      toast.error('请先输入 API Key');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          content: '测试连接',
          config: {
            provider: config.provider,
            apiKey: config.apiKey,
            apiEndpoint: config.apiEndpoint,
            model: config.model,
          },
        }),
      });

      if (response.ok) {
        setTestResult('success');
        toast.success('连接测试成功');
      } else {
        setTestResult('error');
        toast.error('连接测试失败');
      }
    } catch {
      setTestResult('error');
      toast.error('连接测试失败');
    } finally {
      setIsTesting(false);
    }
  };

  // 切换提供商
  const handleProviderChange = (provider: AIProvider) => {
    const preset = providerPresets[provider];
    setConfig({
      ...config,
      provider,
      apiEndpoint: preset.endpoint,
      model: preset.defaultModel,
    });
    setTestResult(null);
  };

  // 保存编辑器设置
  const handleSaveEditorSettings = () => {
    localStorage.setItem('editor-font-size', editorFontSize.toString());
    localStorage.setItem('editor-auto-save', autoSave.toString());
    toast.success('编辑器设置已保存');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center px-6 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.settings.backToEditor}
          </Button>
          <Separator orientation="vertical" className="h-6 mx-4" />
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {t.settings.title}
          </h1>
        </div>
      </header>

      <main className="container px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* AI 模型配置 */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">AI 模型配置</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    配置 AI 写作助手的模型和 API 参数
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 提供商选择 */}
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-sm font-medium">AI 提供商</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value) => handleProviderChange(value as AIProvider)}
                >
                  <SelectTrigger id="provider" className="bg-muted/50">
                    <SelectValue placeholder="选择 AI 提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(providerPresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  选择不同的 AI 服务提供商
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4 text-primary" />
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => {
                      setConfig({ ...config, apiKey: e.target.value });
                      setTestResult(null);
                    }}
                    placeholder="输入您的 API Key"
                    className="pr-10 bg-muted/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.provider === 'doubao' && '在火山引擎控制台获取 API Key'}
                  {config.provider === 'deepseek' && '在 DeepSeek 官网获取 API Key'}
                  {config.provider === 'openai' && '在 OpenAI 官网获取 API Key'}
                  {config.provider === 'kimi' && '在月之暗面开放平台获取 API Key'}
                  {config.provider === 'custom' && '输入您的自定义 API Key'}
                </p>
              </div>

              {/* API Endpoint */}
              <div className="space-y-2">
                <Label htmlFor="endpoint" className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  API Endpoint
                </Label>
                <Input
                  id="endpoint"
                  type="text"
                  value={config.apiEndpoint}
                  onChange={(e) => {
                    setConfig({ ...config, apiEndpoint: e.target.value });
                    setTestResult(null);
                  }}
                  placeholder="API 端点地址"
                  disabled={config.provider !== 'custom'}
                />
                <p className="text-xs text-muted-foreground">
                  {config.provider === 'custom'
                    ? '输入自定义 API 端点地址'
                    : '使用预设端点，如需自定义请选择"自定义"提供商'}
                </p>
              </div>

              {/* 模型选择 */}
              <div className="space-y-2">
                <Label htmlFor="model">模型</Label>
                {config.provider === 'custom' ? (
                  <Input
                    id="model"
                    type="text"
                    value={config.model}
                    onChange={(e) => {
                      setConfig({ ...config, model: e.target.value });
                      setTestResult(null);
                    }}
                    placeholder="输入模型名称"
                  />
                ) : (
                  <Select
                    value={config.model}
                    onValueChange={(value) => {
                      setConfig({ ...config, model: value });
                      setTestResult(null);
                    }}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerPresets[config.provider]?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  选择或输入要使用的 AI 模型
                </p>
              </div>

              {/* 参数配置 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Temperature (创造性)</Label>
                    <span className="text-sm text-muted-foreground">
                      {config.temperature.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={(value) =>
                      setConfig({ ...config, temperature: value[0] })
                    }
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    较低的值更稳定，较高的值更有创造性
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大输出长度</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxTokens: parseInt(e.target.value) || 2048,
                      })
                    }
                    min={100}
                    max={32000}
                  />
                  <p className="text-xs text-muted-foreground">
                    控制生成内容的最大长度
                  </p>
                </div>
              </div>

              {/* 系统提示词 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemPrompt" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    自定义系统提示词
                  </Label>
                  <Switch
                    checked={config.enableSystemPrompt}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, enableSystemPrompt: checked })
                    }
                  />
                </div>
                {config.enableSystemPrompt && (
                  <Textarea
                    id="systemPrompt"
                    value={config.systemPrompt}
                    onChange={(e) =>
                      setConfig({ ...config, systemPrompt: e.target.value })
                    }
                    placeholder="输入自定义系统提示词..."
                    rows={4}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  自定义系统提示词可以改变 AI 的行为风格
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-4">
                <Button onClick={handleSaveConfig} className="gap-2">
                  <Save className="h-4 w-4" />
                  保存配置
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.apiKey}
                  className="gap-2"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  测试连接
                </Button>
                <Button variant="outline" onClick={handleResetConfig}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
                
                {/* 测试结果指示器 */}
                {testResult === 'success' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">连接成功</span>
                  </div>
                )}
                {testResult === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">连接失败</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 存储设置 */}
          <StorageSettings />

          {/* 编辑器设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                <CardTitle>编辑器设置</CardTitle>
              </div>
              <CardDescription>
                自定义编辑器的外观和行为
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 字体大小 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>字体大小</Label>
                  <span className="text-sm text-muted-foreground">
                    {editorFontSize}px
                  </span>
                </div>
                <Slider
                  value={[editorFontSize]}
                  onValueChange={(value) => setEditorFontSize(value[0])}
                  min={10}
                  max={24}
                  step={1}
                />
              </div>

              {/* 自动保存 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自动保存</Label>
                  <p className="text-xs text-muted-foreground">
                    自动保存文档到本地存储
                  </p>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>

              {/* 主题切换 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>深色模式</Label>
                  <p className="text-xs text-muted-foreground">
                    切换编辑器主题
                  </p>
                </div>
                {mounted ? (
                  <Select
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色</SelectItem>
                      <SelectItem value="dark">深色</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-32 h-9 bg-muted rounded-md animate-pulse" />
                )}
              </div>

              <Separator />

              <Button onClick={handleSaveEditorSettings} className="gap-2">
                <Save className="h-4 w-4" />
                {t.common.save}
              </Button>
            </CardContent>
          </Card>

          {/* 外观设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>{t.settings.appearance.title}</CardTitle>
              </div>
              <CardDescription>
                {t.settings.appearance.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 语言切换 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.settings.appearance.language}</Label>
                  <p className="text-xs text-muted-foreground">
                    {i18nMounted && language === 'zh' ? '切换应用显示语言' : 'Switch display language'}
                  </p>
                </div>
                {i18nMounted ? (
                  <Select
                    value={language}
                    onValueChange={(value) => {
                      setLanguage(value as 'zh' | 'en');
                      toast.success(t.settings.appearance.languageSaved);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">{t.settings.appearance.chinese}</SelectItem>
                      <SelectItem value="en">{t.settings.appearance.english}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-32 h-9 bg-muted rounded-md animate-pulse" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* PWA 安装 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <CardTitle>{t.settings.pwa.title}</CardTitle>
              </div>
              <CardDescription>
                {t.settings.pwa.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 安装状态 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.settings.pwa.install}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.pwa.installPrompt}
                  </p>
                </div>
                {isInstalled ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">{t.settings.pwa.installed}</span>
                  </div>
                ) : canInstall ? (
                  <Button onClick={install} className="gap-2">
                    <Download className="h-4 w-4" />
                    {t.settings.pwa.install}
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t.settings.pwa.notSupported}
                  </span>
                )}
              </div>

              <Separator />

              {/* PWA 功能列表 */}
              <div className="space-y-3">
                <Label>{t.settings.pwa.features}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t.settings.pwa.offline}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t.settings.pwa.shortcuts}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="text-sm">{t.settings.pwa.notifications}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 功能说明 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <CardTitle>功能说明</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">AI 写作助手</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 续写内容 - 自动续写文档</li>
                    <li>• 润色文本 - 优化语言表达</li>
                    <li>• 扩展内容 - 添加更多细节</li>
                    <li>• 改写内容 - 重新表达</li>
                    <li>• 生成摘要 - 提取要点</li>
                    <li>• 生成大纲 - 创建框架</li>
                    <li>• 生成标题 - 标题建议</li>
                    <li>• 翻译文本 - 中英互译</li>
                    <li>• 修正错误 - 语法检查</li>
                    <li>• 解释内容 - 简单说明</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">支持的 AI 服务</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 豆包 (字节跳动)</li>
                    <li>• DeepSeek</li>
                    <li>• OpenAI (GPT)</li>
                    <li>• Kimi (月之暗面)</li>
                    <li>• 自定义 OpenAI 兼容 API</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
