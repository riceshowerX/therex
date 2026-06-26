/**
 * CSS 模块类型声明
 * 用于支持 CSS 文件的动态导入
 */

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module 'katex/dist/katex.min.css';

declare module 'highlight.js/styles/*.css';
