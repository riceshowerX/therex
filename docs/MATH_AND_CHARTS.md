# 数学公式与图表使用指南

## 支持的功能

MarkFlow 现已支持：
- ✅ 数学公式渲染（KaTeX）
- ✅ 流程图、时序图等图表（Mermaid）
- ✅ GitHub Flavored Markdown（GFM）
- ✅ 代码语法高亮

## 数学公式

### 行内公式

使用 `$...$` 包裹数学公式。

**示例：**
```
质能方程是 $E = mc^2$，这是爱因斯坦最著名的公式。
```

**效果：**
质能方程是 $E = mc^2$，这是爱因斯坦最著名的公式。

### 块级公式

使用 `$$...$$` 包裹数学公式。

**示例：**
```
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

**效果：**
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### 常用数学符号

| 符号 | LaTeX | 示例 |
|------|-------|------|
| 分数 | `\frac{a}{b}` | `$\frac{a}{b}$` |
| 下标 | `x_{n}` | `$x_{n}$` |
| 上标 | `x^{n}` | `$x^{n}$` |
| 求和 | `\sum_{i=1}^{n}` | `$\sum_{i=1}^{n}$` |
| 积分 | `\int_{a}^{b}` | `$\int_{a}^{b}$` |
| 希腊字母 | `\alpha`, `\beta` | `$\alpha, \beta$` |
| 根号 | `\sqrt{x}` | `$\sqrt{x}$` |
| 矩阵 | `\begin{pmatrix}...\end{pmatrix}` | 见块级公式示例 |

## 图表（Mermaid）

### 流程图

```mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[执行]
    B -->|否| D[跳过]
    C --> E[结束]
    D --> E
```

### 时序图

```mermaid
sequenceDiagram
    participant 用户
    participant 系统
    participant 数据库
    
    用户->>系统: 发送请求
    系统->>数据库: 查询数据
    数据库-->>系统: 返回结果
    系统-->>用户: 返回响应
```

### 类图

```mermaid
classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    
    class Document {
        +String title
        +String content
        +save()
        +delete()
    }
    
    User "1" --> "*" Document : owns
```

### 状态图

```mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 进行中
    进行中 --> 已完成
    进行中 --> 已取消
    已完成 --> [*]
    已取消 --> [*]
```

### 甘特图

```mermaid
gantt
    title 项目进度
    dateFormat  YYYY-MM-DD
    section 需求分析
    需求调研       :a1, 2024-01-01, 10d
    需求分析       :a2, after a1, 5d
    section 开发
    前端开发       :b1, 2024-01-16, 20d
    后端开发       :b2, 2024-01-16, 15d
    测试           :b3, after b2, 5d
```

### 饼图

```mermaid
pie title 技术栈分布
    "React" : 30
    "Next.js" : 25
    "TypeScript" : 20
    "Tailwind" : 15
    "其他" : 10
```

### 思维导图

```mermaid
mindmap
  root((MarkFlow))
    编辑器
      Markdown
      实时预览
      语法高亮
    功能
      AI 助手
      文档管理
      版本历史
    技术
      Next.js
      React
      Supabase
```

### 实体关系图

```mermaid
erDiagram
    USER ||--o{ DOCUMENT : "creates"
    FOLDER ||--o{ DOCUMENT : "contains"
    DOCUMENT ||--o{ VERSION : "has"
    
    USER {
        string id PK
        string name
        string email
    }
    
    DOCUMENT {
        string id PK
        string title
        text content
        string folder_id FK
    }
    
    FOLDER {
        string id PK
        string name
        string parent_id FK
    }
```

## 混合使用

你可以在同一文档中混合使用数学公式和图表：

$$
\oint_C \mathbf{E} \cdot d\mathbf{l} = -\frac{d\Phi_B}{dt}
$$

```mermaid
graph LR
    A[输入] --> B[处理]
    B --> C[输出]
```

## 高级示例

### 复杂数学公式

$$
\begin{aligned}
f(x) &= \int_{-\infty}^{\infty} \hat{f}(\xi)\,e^{2\pi i \xi x} \,d\xi \\
&= \sum_{n=-\infty}^{\infty} c_n e^{inx}
\end{aligned}
$$

### 复杂流程图

```mermaid
graph TB
    Start[开始] --> Init[初始化]
    Init --> Check{检查输入}
    Check -->|有效| Process[处理数据]
    Check -->|无效| Error[显示错误]
    Error --> End[结束]
    Process --> Validate{验证结果}
    Validate -->|成功| Save[保存数据]
    Validate -->|失败| Retry[重试]
    Retry --> Process
    Save --> End
```

## 快速开始

1. 打开 MarkFlow 编辑器
2. 创建新文档或选择"数学公式与图表"模板
3. 输入数学公式或图表代码
4. 切换到预览模式查看渲染效果

## 注意事项

- 数学公式必须使用 `$` 或 `$$` 包裹
- 图表代码必须使用 ` ```mermaid` 代码块
- 支持所有标准的 LaTeX 数学符号
- 图表渲染需要 JavaScript 支持（预览模式）

## 资源链接

- [KaTeX 官方文档](https://katex.org/docs/supported.html)
- [Mermaid 官方文档](https://mermaid.js.org/intro/)
- [LaTeX 数学符号参考](https://oeis.org/wiki/List_of_LaTeX_mathematical_symbols)

---

如有问题，请参考模板文档或提交 Issue。
