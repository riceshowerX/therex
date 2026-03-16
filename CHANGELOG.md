# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 文档统计信息面板（字符数、词数、行数、阅读时间、中英文比例等）
- 快捷键提示面板（分类展示所有快捷键）
- 自动保存状态提示组件
- 增强版导出功能（支持 Markdown、HTML、PDF、Word、纯文本、JSON）
- 增强版编辑器工具栏（标题、格式、链接、图片、代码块、表格快捷插入）
- 错误边界组件
- 实用 Hooks 库（自动保存、本地存储、全屏、快捷键等）
- API 工具库（请求验证、错误处理、日志记录、Rate Limiting）
- 生产环境配置检查工具
- 数学公式与图表使用指南文档

### Changed
- 移除 lodash 依赖，内置 debounce 实现
- 优化 TypeScript 类型定义
- 增强安全验证和错误处理
- 完善项目文档和 README

### Fixed
- 修复 TypeScript 类型错误
- 解决快捷键面板冲突问题

## [1.0.0] - 2024-01-01

### Added
- 初始版本发布
- Markdown 编辑器核心功能
- 实时预览
- 多视图模式
- 深色主题支持
- 多文档管理
- 文件夹管理
- 版本历史
- AI 写作助手集成
- AI 对话模式
- 模板系统
- PWA 支持
- Supabase 数据持久化
- 数学公式渲染（KaTeX）
- 图表绘制（Mermaid）
- 数据可视化（ECharts）
