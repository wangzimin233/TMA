# Trade Orderbook Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stepper controls to spot order inputs and make the compact order book request 20 levels with mode-aware display controls.

**Architecture:** Keep the change inside the existing trade page component tree. Lift spot `orderType` to `SpotTradingWorkspace` so the order book can react to limit/market mode, reuse `TradeInput` for stepper controls, and add decimal helpers for tick/step arithmetic.

**Tech Stack:** React 19, TypeScript, shadcn/ui input/slider/dropdown primitives, lucide-react icons, project decimal helpers.

## Global Constraints

- Use shadcn/ui as the base layer for standard controls already present in the project.
- Trading page must fit Telegram Mini App narrow width, especially 390px, without horizontal overflow.
- Price/quantity trading calculations must not rely on JavaScript float arithmetic.
- Stepper increments must use backend trading rules: `tickSize` for price and `stepSize` for quantity.
- Disabled/loading states must not use `cursor-pointer`.

---

### Task 1: Decimal Step Helper

**Files:**
- Modify: `src/lib/decimal.ts`
- Test: inline Node check against `src/lib/decimal.ts`

**Interfaces:**
- Produces: `addDecimalStrings(left: string, right: string): string`
- Produces: `subtractDecimalStrings(left: string, right: string): string`
- Produces: `floorDecimalAtZero(value: string): string`

- [ ] Write failing Node import check for decimal addition/subtraction.
- [ ] Implement bigint-based decimal add/subtract helpers in `src/lib/decimal.ts`.
- [ ] Re-run the Node check.

### Task 2: Spot Input Steppers

**Files:**
- Modify: `src/pages/trade/TradePage.tsx`

**Interfaces:**
- Consumes: `useSpotExchangeInfo(symbol)` for `tickSize` and `stepSize`.
- Consumes: decimal helpers from Task 1.
- Produces: `TradeInput` optional stepper buttons through `onStepDown`, `onStepUp`, and `stepDisabled`.

- [ ] Add a failing static check that `TradeInput` renders stepper buttons and `SpotOrderForm` passes price/quantity steppers.
- [ ] Extend `TradeInput` with compact left/right icon buttons.
- [ ] Wire price stepper to `tickSize` and quantity stepper to `stepSize` only in limit mode.
- [ ] Re-run static check.

### Task 3: Order Book Shared Mode And Display Controls

**Files:**
- Modify: `src/pages/trade/TradePage.tsx`

**Interfaces:**
- Consumes: shared `orderType` from `SpotTradingWorkspace`.
- Produces: `CompactOrderBook` `orderType` prop and local `depthView`.

- [ ] Add a failing static check for `useSpotDepth(symbol, 20)` and depth view buttons.
- [ ] Lift `orderType` state to `SpotTradingWorkspace`.
- [ ] Fetch compact depth with limit 20.
- [ ] Add buy/sell/both icon controls under the compact order book.
- [ ] Adjust displayed rows by order type and depth view.
- [ ] Re-run static check.

### Task 4: Verification

**Files:**
- Verify: `src/pages/trade/TradePage.tsx`
- Verify: `src/lib/decimal.ts`

- [ ] Run `pnpm build`.
- [ ] Use browser at `http://localhost:5173/trade?symbol=BNBUSDT` with 390px viewport.
- [ ] Verify no horizontal overflow.
- [ ] Verify stepper buttons exist for price and limit quantity, and compact order book has three mode buttons.
