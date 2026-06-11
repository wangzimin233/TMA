# Design System Notes

## Visual Direction

专业、克制、偏交易所工具界面。整体参考 Binance 移动端交易表单的密度和结构，但主题色使用当前项目的冷蓝灰暗色底与绿色/红色交易语义。

## Palette

- App background: `#080c13`
- Base surface: `#171d27`
- Raised surface: `#1f2632`
- Panel/card: `#1a202b`, `#1b2330`
- Navigation: `#121923`
- Border: `#3c4656`
- Text: `#e6edf5`
- Muted text: `#8b96a8`
- Buy/success: `#2fbe85`
- Sell/danger: `#f6475d`
- Active order-tab underline/warning: `#f0b90b`

## Typography

- Product UI 使用单一 sans 字体栈即可，重点是密度和一致性。
- 交易数字使用 monospace，并启用 tabular numbers。
- 移动端主要标签控制在 `0.72rem` 到 `0.95rem`。
- 价格主数字可以大，但不能挤压其他信息：交易页主价约 `1.45rem` 到 `1.6rem`。
- 避免大面积 `text-xl` 以上字号，除非是当前交易价格或资产总额。

## Layout Rules

- 所有页面必须在 `390px` 宽度下无横向滚动。
- 表格列使用 `minmax(0, 1fr)` 和明确的右侧列宽，避免价格/涨跌按钮被截断。
- 底部导航必须轻量但不能虚弱，约 `52px` 高；不使用选中图标底色或顶部强调线，只通过图标/文字颜色表达当前页，图标视觉权重要略高于文字。
- 页面底部内容要预留足够空间，避免被固定底部导航遮住。
- 卡片只用于确实需要聚合的信息。资料页和列表页优先使用分割线、行项目和轻量表面。
- 所有横向 tabs / filter chips 必须支持左右滑动：容器使用 `overflow-x-auto`、`whitespace-nowrap`、隐藏滚动条；子项使用 `shrink-0`。不要用 `justify-between` 强行塞满一行，超出时不能换行或挤乱布局。

## Component Rules

- 构建页面或弹窗时，优先使用 shadcn/ui 组件作为基础组件层。
- 弹窗、抽屉、确认框、表单控件、按钮、输入框、Tabs、Dropdown、Popover 等常见交互，不要优先手写。
- 允许在 shadcn/ui 组件外层覆盖 `className`，以匹配本项目交易所风格、暗色主题和移动端密度。
- 只有当 shadcn/ui 没有合适组件，或组件会明显破坏交易所体验时，才允许手写。
- 新增 shadcn/ui 组件使用 `pnpm dlx shadcn@latest add <component>`，包管理统一使用 `pnpm`。

## Trading Form Rules

- 订单类型区当前固定为：限价 / 市价。条件委托先不展示，后续需要时再补。
- 合约页展示：止盈止损、只减仓、GTC、全仓/杠杆、强平价格、保证金、可开。
- 现货页展示：可用、预计买入、预计卖出，不展示强平、保证金、杠杆。
- 输入框高度约 `3.9rem`，圆角约 `8px`，边框低对比但清晰。
- 买入和卖出按钮并列，颜色只用于明确交易动作。
- 百分比滑轨使用克制的 diamond 节点，不能像游戏控件。

## Chart Rules

- K 线使用 `lightweight-charts`，不能再用 CSS 假图。
- 图表页必须展示真实 canvas、时间轴、价格轴、红绿蜡烛和当前价格线。
- K 线页盘口可滚动，底部要避开导航。
