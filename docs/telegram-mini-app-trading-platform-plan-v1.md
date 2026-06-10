# Telegram Mini App 交易平台项目方案（V1）

## 项目定位

基于 Telegram Mini App（TMA）的数字货币交易平台。

核心目标：

- 邮箱注册登录
- 行情展示（Binance）
- 现货交易
- 合约交易
- 充值
- 提现
- 邀请返佣

项目定位：

> Telegram 内嵌版轻量交易所

---

# 技术架构

## 前端技术栈

```bash
React 19

TypeScript

Vite 6

TailwindCSS 4
```

---

## 状态管理

使用：

```bash
zustand
```

管理：

```text
用户信息
Token
当前交易对
当前K线周期
主题
语言
Telegram信息
```

---

## 服务端状态管理

使用：

```bash
@tanstack/react-query v5
```

管理：

```text
资产
订单
持仓
充值记录
提现记录
邀请记录
公告
Banner
```

---

## 网络请求

```bash
axios
```

---

## 图表方案

### K线

```bash
lightweight-charts
```

（TradingView Lightweight Charts）

特点：

- 免费
- 高性能
- 金融行业标准方案
- 支持实时更新
- 支持缩放拖动

---

### 深度图

```bash
echarts
```

---

### 首页迷你走势图

```bash
echarts
```

---

### 资产统计图

```bash
echarts
```

---

## 表单

```bash
react-hook-form
```

---

## 国际化

```bash
i18next
react-i18next
```

---

## 时间处理

```bash
dayjs
```

---

## 工具库

```bash
lodash-es

clsx
```

---

## Telegram SDK

```bash
@telegram-apps/sdk-react
```

---

# 推荐依赖

```bash
pnpm add \
axios \
zustand \
@tanstack/react-query \
react-hook-form \
i18next \
react-i18next \
lightweight-charts \
echarts \
socket.io-client \
dayjs \
lodash-es \
clsx \
@telegram-apps/sdk-react
```

---

# Telegram Mini App 必备条件

## Telegram Bot

创建：

```text
@BotFather
```

获取：

```text
BOT_TOKEN
```

---

## HTTPS 域名

Telegram WebApp 必须：

```text
https://
```

---

## WebApp

本质：

```text
React H5
```

通过 Telegram 打开。

---

# 页面结构

## 底部导航

```text
首页
行情
交易
我的
```

---

# 首页

参考截图1布局。

原则：

```text
简洁
轻量
突出交易
```

---

## Banner

内容：

```text
活动
公告
新手奖励
邀请奖励
```

后台配置。

---

## 快捷入口

```text
充值
提现
邀请好友
客服
```

---

## 主流币行情

展示：

```text
BTC
ETH
BNB
SOL
```

内容：

```text
价格
24H涨跌幅
```

---

## 热门币列表

Tab：

```text
热门
涨幅榜
跌幅榜
```

列表内容：

```text
币种

最新价

24H涨跌
```

---

## 公告栏

滚动公告。

---

# 行情页

参考截图2。

删除：

```text
创新区
AI专区
MEME专区
零手续费专区
```

等复杂筛选。

---

## 页面结构

```text
搜索框

热门币

交易对列表
```

---

## 列表展示

```text
BTC/USDT

最新价格

24H涨跌幅
```

点击进入交易页。

---

# 交易页

核心功能：

```text
现货交易
合约交易
```

---

## 页面结构

```text
交易对信息

K线

盘口

成交记录

下单区
```

---

## K线区域

使用：

```text
TradingView Lightweight Charts
```

---

## 盘口

展示：

```text
买盘

卖盘

实时价格
```

---

## 最近成交

展示：

```text
成交价格

成交数量

成交时间
```

---

## 现货交易

支持：

```text
限价单

市价单
```

---

## 合约交易

支持：

```text
开多

开空
```

---

杠杆：

```text
1x~125x
```

由后台配置。

---

# 我的页面

待二期补充。

当前预留：

```text
个人中心

资产

订单记录

资金记录

邀请好友

安全中心

语言设置

联系客服
```

---

# 注册登录

采用邮箱注册。

---

## 注册

```text
邮箱

验证码

密码

确认密码

邀请码（选填）
```

---

## 登录

```text
邮箱

密码
```

---

## 忘记密码

邮箱验证码找回。

---

# 充值

## 支持网络

```text
BSC(BEP20)

ETH(ERC20)

TRX(TRC20)
```

---

## 方案

采用：

```text
自建充值地址
+
链监听
```

不使用第三方托管钱包。

---

## 流程

```text
充值
↓
选择网络
↓
显示地址
↓
用户转账
↓
链监听
↓
到账
↓
余额增加
```

---

## 页面元素

```text
网络选择

充值地址

二维码

复制按钮

充值记录
```

---

# 提现

## 流程

```text
提现
↓
选择网络
↓
输入地址
↓
输入金额
↓
邮箱验证码
↓
提交
```

---

## 页面元素

```text
网络

提现地址

金额

手续费

邮箱验证码

预计到账
```

---

# 邀请好友

## 功能

```text
邀请码

邀请链接

邀请人数

返佣记录
```

---

## 首页入口

快捷入口展示。

---

# 行情数据来源

采用：

```text
Binance
```

---

## 使用内容

```text
Ticker

K线

Depth

Trade
```

---

## 不使用

```text
Binance交易接口
```

仅接行情。

---

# WebSocket架构

## V1方案

不使用 RxJS。

---

## 数据流

```text
Binance WS
        ↓
     后端转发
        ↓
   Frontend WS
        ↓
      Buffer
        ↓
requestAnimationFrame
        ↓
 TradingView
```

---

# 高频数据处理原则

不要：

```ts
useState(klineData)
```

不要：

```ts
zustand.setState(klineData)
```

不要：

```ts
dispatch(setKlineData())
```

---

原因：

```text
高频更新会导致大量重渲染
```

---

# K线实时更新方案

## 队列缓存

```ts
const queue = []
```

---

## WebSocket消息

```ts
ws.onmessage = (event) => {
  queue.push(JSON.parse(event.data))
}
```

---

## 动画帧消费

```ts
function tick() {
  while (queue.length) {
    const item = queue.shift()

    candleSeries.update(item)
  }

  requestAnimationFrame(tick)
}

tick()
```

---

## 优势

支持：

```text
100+
200+
500+
消息/秒
```

稳定运行。

---

# Zustand职责

仅管理：

```ts
token

userInfo

telegramInfo

theme

locale

currentSymbol

currentInterval

selectedLeverage
```

---

禁止管理：

```ts
klineData

depthData

tradeData

tickerData
```

---

# React Query职责

管理：

```ts
资产

订单

持仓

充值记录

提现记录

邀请记录

公告

Banner
```

---

# 推荐目录结构

```text
src
├── api
├── assets
├── charts
├── components
├── hooks
├── layouts
├── locales
├── pages
│   ├── home
│   ├── market
│   ├── trade
│   └── mine
├── services
├── store
│   ├── auth.store.ts
│   ├── app.store.ts
│   └── trade.store.ts
├── telegram
├── types
├── utils
├── websocket
└── main.tsx
```

---

# Store设计

## auth.store.ts

```ts
token

userInfo

isLogin
```

---

## app.store.ts

```ts
theme

locale

telegramInfo
```

---

## trade.store.ts

```ts
currentSymbol

currentInterval

selectedLeverage
```

---

# Query设计

## 用户相关

```ts
useUserAssets()

useUserProfile()
```

---

## 订单相关

```ts
useSpotOrders()

useContractOrders()
```

---

## 资金相关

```ts
useDepositRecords()

useWithdrawRecords()
```

---

## 邀请相关

```ts
useInviteRecords()
```

---

# MVP功能范围

## 用户

✅ 注册

✅ 登录

✅ 忘记密码

---

## 资产

✅ 充值

✅ 提现

✅ 资金记录

---

## 行情

✅ Binance行情

✅ 实时价格

✅ K线

✅ 深度

---

## 交易

✅ 现货交易

✅ 合约交易

✅ 订单记录

---

## 推广

✅ 邀请好友

✅ 返佣记录

---

## 系统

✅ 多语言

✅ Telegram Mini App

---

# V2规划

后续扩展：

```text
代理系统

多级返佣

跟单系统

Launchpad

理财

Staking

NFT

VIP等级

红包系统

Telegram群机器人联动
```

---

# 项目补充说明（已确认）

## 参考截图

截图1：首页参考

```text
docs/assets/reference-home.png
```

截图2：行情页参考

```text
docs/assets/reference-market.png
```

截图3：交易页下单布局参考

```text
docs/assets/reference-trade-order.png
```

截图4：交易页 K线图表展开参考

```text
docs/assets/reference-trade-chart.png
```

---

## 当前项目阶段

当前暂无后端服务。

V1 前端开发阶段先使用 mock 数据完成页面、交互、状态流转和接口对接结构。

后续后端会接入 Binance 相关接口。

---

## 平台交易模式

项目采用平台代理下单模式：

```text
用户在平台下单
↓
平台后端接收订单
↓
平台使用自有/托管交易账号请求 Binance 下单
↓
后端同步订单状态、成交记录、资产变化
↓
前端展示给用户
```

说明：

```text
前端不直接请求 Binance 交易接口

用户不直接连接 Binance 账号

Binance 行情可由后端转发给前端

Binance 交易由后端统一处理
```

---

## 交易页补充

交易页参考：

```text
docs/assets/reference-trade-order.png

docs/assets/reference-trade-chart.png
```

交易页默认展示下单布局：

```text
交易类型切换：现货 / 合约

交易对信息：币种图标、交易对、最新价、折算价格、24H涨跌幅

收藏按钮

K线图标按钮

买入 / 卖出切换

限价 / 市价切换

可用余额

价格输入

数量输入

比例选择：0% / 25% / 50% / 75% / 100%

交易额输入

提交按钮

当前委托
```

不做：

```text
交易机器人入口
```

说明：

```text
截图中红框标记的“交易机器人”不进入 V1 功能范围，前端不要展示该入口。
```

### K线图标交互

点击交易页顶部的 K线图标后，展示 K线图表视图。

图表视图包含：

```text
交易对信息

最新价

折算价格

24H涨跌幅

24H最高价

24H最低价

24H成交量

24H成交额

图表 / 币种概况 Tab

周期切换：15分钟 / 30分钟 / 1小时 / 4小时 / 1天 / 周线 / 月线

K线图

底部买入 / 卖出操作区
```

图表实现：

```text
TradingView Lightweight Charts
```

交互原则：

```text
下单视图点击 K线图标进入图表视图

图表视图保留买入 / 卖出快捷操作

当前交易对、K线周期使用 trade.store.ts 管理

K线高频数据仍然不进入 Zustand
```

---

## 行情与交易对

交易对列表后续由后端接口返回。

当前前端先使用 mock 数据。

V1 mock 交易对可先覆盖：

```text
BTC/USDT
ETH/USDT
BNB/USDT
SOL/USDT
XRP/USDT
UNI/USDT
```

---

## 充值资产

当前充值统一使用：

```text
USDT
```

网络暂按原方案保留：

```text
BSC(BEP20)
ETH(ERC20)
TRX(TRC20)
```

充值地址生成、链监听、到账确认由后端处理，前端只负责展示地址、二维码、复制、充值记录和状态。

---

## 待定项

以下内容先保留，后续根据业务推进再补充：

```text
合规与风控

后台管理系统

部署域名

Telegram Bot 配置

生产环境变量

提现审核规则

手续费规则

KYC 策略
```
