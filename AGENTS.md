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

## Motion Interaction Policy

- 全局动效采用“克制交易所”风格：短时长、低位移、轻反馈，避免夸张弹跳、长距离滑动或营销感动画。
- 新增页面切换、按钮反馈、Tab/Dropdown/Popover 等交互动效时，优先复用 `src/styles.css` 中的全局 motion tokens 和工具类。
- 页面切换应保持行情、价格、下单表单等交易核心信息稳定可读，交易页不要使用会干扰扫盘和下单的大幅位移动画。
- 所有动效必须支持 `prefers-reduced-motion: reduce` 降级，降级后状态变化仍要清晰可辨。
- 新增或调整动效后，必须检查 `390px` 宽度下没有横向溢出、文字遮挡或底部 tabbar 布局跳动。
