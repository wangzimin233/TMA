# Project Agent Rules

## UI Component Policy

- 构建页面、弹窗、抽屉、确认框、表单、按钮、输入框、Tabs、Dropdown、Popover 等常见 UI 时，优先使用 shadcn/ui 组件作为基础组件层。
- 使用 shadcn/ui 后，可以通过 `className` 覆盖视觉样式，以匹配本项目的交易所风格、暗色主题和移动端信息密度。
- 不要为了省事优先手写标准交互组件。只有当 shadcn/ui 没有合适组件，或组件行为会明显破坏交易体验时，才允许手写。
- 新增 shadcn/ui 组件时使用 `pnpm dlx shadcn@latest add <component>`，依赖管理统一使用 `pnpm`。

## Product UI Direction

- 交易页优先级最高，界面应接近成熟交易所移动端工具，而不是营销页或泛 App 卡片风格。
- 所有页面必须适配 Telegram Mini App 窄屏场景，重点检查 `390px` 宽度下无横向溢出。
- 保持字体、间距、控件高度克制，避免大字老人机式界面。
- mock 数据阶段也要按后续真实接口结构设计 UI，避免临时页面结构。
