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

## Market Data / WebSocket Policy

- 高频行情接入必须采用“REST 快照 + WebSocket 增量”模型：首次进入、切换交易对、重连或检测到增量序号断层时，先重新拉取快照，再应用后续增量。
- WebSocket 消息必须具备可校验顺序或去重字段。盘口依赖 `lastUpdateId`、`updateId` 或 `seq` 做连续性校验；成交依赖 `tradeId` 去重；K 线依赖 `symbol + interval + openTime` 合并；ticker/summary 依赖 `eventTime` 或 `seq` 丢弃旧消息。
- 不允许每条 WebSocket 消息直接触发 React 状态更新。高频消息必须先进入内存 buffer，再通过 `requestAnimationFrame` 或 `50ms-100ms` 批量 flush，保证数据处理频率和 UI 渲染频率解耦。
- 页面组件只消费整理后的稳定行情状态，不直接处理原始 WebSocket payload。原始消息解析、去重、乱序处理、批量提交应集中在行情 service/store 层。
- 盘口增量如果发现序号不连续，必须丢弃本地盘口并重新拉取快照；不能靠跳过缺失消息继续展示。
- ticker/summary 同一交易对只保留最新状态；trades 保留固定长度最新列表；K 线更新当前未收盘 candle，`closed=true` 后再进入下一根。
- 切换交易对、交易模式或 K 线周期后，旧订阅返回的迟到消息不得写入当前状态，必须通过订阅 key、symbol、interval 或版本号校验后再应用。
- React Query 可继续作为快照、fallback 和低频补偿来源；WebSocket 正常工作时，应避免 HTTP 轮询和 WS 同时高频更新同一份 UI 状态。
- 高频行情实现后必须验证：100 条/秒消息输入下数据不乱序、不重复渲染过度、切换交易对无旧数据回写，且 Telegram Mini App 390px 宽度下交易核心信息稳定可读。

## Financial Data / Precision Policy

- 真实交易金额、价格、数量、手续费、成交额、保证金、盈亏、余额等资金数据，接口层应优先使用 decimal string；前端核心计算统一通过 `bignumber.js` 的项目封装工具处理。
- 页面组件不得直接使用 JavaScript 浮点数、`Number()`、`parseFloat()` 或展示用 `toFixed()` 结果参与交易校验、余额比较、步长判断或订单提交。
- 展示格式和交易值必须分离。`toFixed()`、`toLocaleString()`、缩写单位、千分位等只用于 UI 展示，不能作为订单提交 payload 或风控判断输入。
- 下单数量、委托价格、最小成交额、最小数量、价格步长、数量步长必须基于后端交易规则校验，例如 `tickSize`、`stepSize`、`minQty`、`minNotional`。
- 涉及最大可买、最大可卖、手续费预估、可用余额扣减等计算时，默认按交易规则向下取整，避免前端显示可提交但后端拒单。
- 现货、合约、充值、提现、划转的金额字段必须保留业务语义，不能混用 base、quote、USDT 估值和法币估值。
- mock 阶段可以使用 number 方便展示；接入真实交易、资产或订单接口前，必须先确认接口金额类型和精度策略，再设计前端类型。

## Decimal Utility Policy

- 项目需要真实交易计算时，应先引入 `bignumber.js`，并在 `src/lib/decimal.ts` 建立统一封装；业务页面不得散落 `new BigNumber()` 逻辑。
- decimal 工具至少应覆盖：创建 decimal、比较大小、加减乘除、按 step/tick 向下取整、校验是否符合步长、格式化展示、输出提交用 decimal string。
- API 请求 payload 中的价格、数量、金额类字段应提交 decimal string，不提交格式化后的展示文本。
- 如果后端未来改为返回最小单位整数和 scale，再评估切换到 `BigInt + scale`；在当前交易对步长和小数规则场景下，默认使用 `bignumber.js`。

## Trading Action Safety Policy

- 下单、提现、划转、取消订单等资金相关动作必须具备明确的 loading、disabled、防重复提交和失败恢复状态。
- 当前交易对、交易模式、订单方向、订单类型、价格、数量、可用余额、交易规则或认证状态未就绪时，不允许提交真实交易请求。
- 真实订单提交必须具备幂等策略，例如 `clientOrderId`、请求锁或明确的 pending 状态；不能因为连点、重试或网络抖动产生重复订单。
- 买入/卖出、开仓/平仓、现货/合约、市价/限价等交易语义必须在 UI、请求参数和状态命名中保持一致，不能靠按钮颜色或临时文案推断。
- 市价单、合约杠杆、只减仓、止盈止损等高风险行为必须在提交前使用后端交易规则和当前账户状态校验，不能只在前端乐观估算。

## Freshness / Degraded State Policy

- 行情、盘口、K 线、余额、持仓、订单状态必须区分 loading、fresh、stale、error、reconnecting 等状态；不能把过期数据展示成实时可交易数据。
- WebSocket 断线、心跳超时、接口错误、认证失效或快照恢复中，交易核心操作应降级为不可提交或给出明确提示。
- 资产、订单、提现、充值等账户数据以后端返回为准；资金相关页面不允许长期依赖乐观更新展示最终状态。
- mock 数据、fallback 数据和真实数据必须有清晰边界。生产交易链路中不得静默回退到 mock 数据。
- 用户执行资金或订单操作成功后，必须刷新或失效相关账户、订单、余额、持仓缓存，避免展示旧状态。

## Verification Policy for Trading Features

- 涉及行情、资产、订单、充值、提现、划转、持仓的改动，必须验证正常路径、接口失败、认证失效、重复提交、长数字、极小数、极大数和空数据状态。
- 涉及价格、数量、余额或手续费的改动，必须验证精度、舍入、步长、最小值、最大值和边界提示。
- 涉及实时行情或订单状态的改动，必须验证切换交易对、切换现货/合约、断线重连、旧消息回写和数据 stale 状态。
- 交易页和资金页必须在 Telegram Mini App 窄屏场景下检查 `390px` 宽度，确保长数字、错误提示、loading 和 disabled 状态不造成横向溢出或关键按钮错位。

## Motion Interaction Policy

- 全局动效采用“克制交易所”风格：短时长、低位移、轻反馈，避免夸张弹跳、长距离滑动或营销感动画。
- 所有交互都应有清晰状态反馈，例如 hover、active、focus、disabled、loading、error；动画只在不影响交易核心信息读取和操作稳定性的场景中使用。
- 交互动效应短促、低位移、低干扰，优先使用颜色、透明度、轻微 transform 表达反馈；交易核心区域不得为了“有动画”而引入布局跳动、夸张缩放或连续闪烁。
- 新增页面切换、按钮反馈、Tab/Dropdown/Popover 等交互动效时，优先复用 `src/styles.css` 中的全局 motion tokens 和工具类。
- 页面切换应保持行情、价格、下单表单等交易核心信息稳定可读，交易页不要使用会干扰扫盘和下单的大幅位移动画。
- 所有动效必须支持 `prefers-reduced-motion: reduce` 降级，降级后状态变化仍要清晰可辨。
- 新增或调整动效后，必须检查 `390px` 宽度下没有横向溢出、文字遮挡或底部 tabbar 布局跳动。

## Interaction Affordance Policy

- 所有非 disabled 的可点击元素必须有明确点击 affordance；在桌面/浏览器环境下应使用 `cursor-pointer`，包括按钮、链接、图标按钮、Tabs、Dropdown/Popover trigger、可点击列表项。
- disabled、loading、不可操作状态不得使用 `cursor-pointer` 暗示可点击；输入框、文本选择、拖拽、滑块等控件应使用符合语义的 cursor。
