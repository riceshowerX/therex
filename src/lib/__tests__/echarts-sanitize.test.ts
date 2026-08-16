/**
 * QA 回归验证：S5 ECharts 配置消毒（markdown-renderer.sanitizeEChartsConfig）
 *
 * 架构师审查报告：ECharts 代码块 JSON 被放行后直接 chart.setOption(config)，
 * tooltip.formatter/rich/backgroundColor/on* 等字段可注入 HTML → 存储型 XSS。
 * 修复要求：剥离 formatter/renderItem/rich/backgroundColor/on* 事件等可注入字段；
 * 字符串含 `<` 或 `javascript:` 拒绝；__proto__ 污染键不得透传；正常 option 保留。
 */

import { describe, it, expect } from 'vitest';
import { sanitizeEChartsConfig } from '@/lib/markdown-renderer';

describe('S5 sanitizeEChartsConfig 消毒', () => {
  it('应剥离 tooltip.formatter（HTML 注入点）', () => {
    const raw = JSON.stringify({
      title: { text: '柱状图' },
      tooltip: {
        formatter: `function(params){ return '<img src=x onerror=alert(1)>' }`,
      },
      series: [{ type: 'bar', data: [1, 2, 3] }],
    });
    const out = sanitizeEChartsConfig(raw);
    expect(out).not.toContain('formatter');
    expect(out).not.toContain('onerror');
    // 正常字段保留
    expect(out).toContain('"type":"bar"');
    expect(out).toContain('柱状图');
  });

  it('应剥离 axisLabel.formatter 等以 formatter 结尾的键', () => {
    const raw = JSON.stringify({
      xAxis: {
        data: ['A', 'B'],
        axisLabel: { formatter: `function(){ return '<script>alert(1)</script>' }` },
      },
      series: [{ type: 'line', data: [1, 2] }],
    });
    const out = sanitizeEChartsConfig(raw);
    expect(out).not.toContain('formatter');
    expect(out).not.toContain('script');
  });

  it('应剥离 onClick / onMouseOver 等事件处理器', () => {
    const raw = JSON.stringify({
      series: [{ type: 'bar', data: [1], onClick: 'alert(1)', onMouseOver: 'evil()' }],
    });
    const out = sanitizeEChartsConfig(raw);
    expect(out).not.toContain('onClick');
    expect(out).not.toContain('onMouseOver');
    expect(out).not.toContain('alert');
  });

  it('应剥离 renderItem / rich / backgroundColor 等可注入字段', () => {
    const raw = JSON.stringify({
      series: [
        {
          type: 'custom',
          renderItem: 'function(params){return ...}',
          data: [1],
        },
      ],
      tooltip: { backgroundColor: 'url(javascript:alert(1))' },
      textStyle: { rich: { a: { backgroundColor: '#fff' } } },
    });
    const out = sanitizeEChartsConfig(raw);
    expect(out).not.toContain('renderItem');
    expect(out).not.toContain('backgroundColor');
    expect(out).not.toContain('rich');
    expect(out).not.toContain('javascript');
  });

  it('字符串值含 < 或 javascript: 的数组项应被剔除', () => {
    const raw = JSON.stringify({
      xAxis: { data: ['正常', '<img src=x onerror=alert(1)>', 'javascript:alert(1)'] },
      series: [{ type: 'bar', data: [1, 2, 3] }],
    });
    const out = sanitizeEChartsConfig(raw);
    const parsed = JSON.parse(out);
    expect(parsed.xAxis.data).not.toContain('<img src=x onerror=alert(1)>');
    expect(parsed.xAxis.data).not.toContain('javascript:alert(1)');
    // 正常项保留
    expect(parsed.xAxis.data).toContain('正常');
  });

  it('__proto__ 污染键不得透传（不产生原型污染输出）', () => {
    const raw = JSON.parse('{"__proto__":{"polluted":true},"series":[{"type":"bar","data":[1,2]}]}');
    const out = sanitizeEChartsConfig(JSON.stringify(raw));
    // 序列化结果不得包含 polluted 键
    expect(out).not.toContain('polluted');
    expect(out).not.toContain('__proto__');
    // 正常字段保留
    expect(out).toContain('"type":"bar"');
  });

  it('正常 option（title/series/data）应原样保留', () => {
    const raw = JSON.stringify({
      title: { text: '销售趋势' },
      xAxis: { type: 'category', data: ['1月', '2月'] },
      yAxis: { type: 'value' },
      series: [{ name: '销量', type: 'line', data: [120, 200] }],
    });
    const out = sanitizeEChartsConfig(raw);
    expect(out).toContain('销售趋势');
    expect(out).toContain('"name":"销量"');
    expect(out).toContain('[120,200]');
  });

  it('非法 JSON 应返回空字符串', () => {
    expect(sanitizeEChartsConfig('{ not json')).toBe('');
  });

  it('空输入 / null / 字符串顶层应返回空字符串', () => {
    expect(sanitizeEChartsConfig('')).toBe('');
    expect(sanitizeEChartsConfig('null')).toBe('');
    expect(sanitizeEChartsConfig('"just a string"')).toBe('');
  });

  it('顶层数组按实现原样返回（无注入面；ECharts setOption 需要对象）', () => {
    expect(JSON.parse(sanitizeEChartsConfig('[1,2,3]') as string)).toEqual([1, 2, 3]);
  });
});
