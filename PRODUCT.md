# Telegram Mini App Trading Product

## Register

product

## Product Purpose

这是一个运行在 Telegram Mini App 内的轻量数字货币交易平台。用户在平台内充值 USDT、查看行情、提交现货或合约订单；后端后续会使用平台交易账号对接第三方交易所（优先币安）完成真实下单、成交和资产同步。

## Users

- Telegram 内的加密货币交易用户。
- 高频查看行情、切换交易对、快速下单的移动端用户。
- 需要充值、提现、订单记录、邀请返佣等基础交易所功能的用户。

## Product Principles

- 交易页优先级最高，必须像成熟交易工具，而不是营销页或普通钱包页。
- 信息密度要接近 Binance / Bitget 类移动端交易界面：标签轻、数字清晰、操作按钮明确。
- 后端未完成前，全部使用 mock 数据，但 UI 结构要按真实接口返回后的形态设计。
- 现货与合约语义必须分开。现货不展示强平价格、保证金、杠杆等合约专属概念。
- 页面要适配 Telegram Mini App 窄屏环境，390px 宽度不能出现横向溢出。

## Anti References

- 不做大字老人机式界面。
- 不做营销 Landing Page 式首页。
- 不做卡片堆叠和过度圆角的泛 App 风格。
- 不用霓虹、玻璃拟态、大片渐变来伪装金融专业感。
