# Transfer Source Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the transfer page with the correct default "from" account when the user taps transfer from a specific profile asset tab.

**Architecture:** Profile owns the active asset tab and passes its account type to the existing route opener. App serializes the optional account type into `/transfer?from=...`. TransferPage validates the query parameter and derives a matching default destination account.

**Tech Stack:** React 19, React Router, TypeScript, shadcn/ui buttons.

## Global Constraints

- Preserve existing transfer defaults when opened from profile overview or any caller without a source account.
- Only accept account types defined by `AccountType`: `FUND`, `SPOT`, `FUTURES`.
- Use existing profile asset tab mapping instead of adding duplicate UI state.
- Keep the change mobile-safe and avoid UI layout changes.

---

### Task 1: Route Transfer Source Account

**Files:**
- Modify: `src/pages/profile/ProfilePage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/transfer/TransferPage.tsx`
- Test: `scripts/check-transfer-source-account.mjs`

**Interfaces:**
- Consumes: `AccountType` from `src/api/account.ts`
- Produces: `openTransfer(fromAccountType?: AccountType): void`
- Produces: `/transfer?from=FUND|SPOT|FUTURES`

- [ ] **Step 1: Write the failing test**

```js
// scripts/check-transfer-source-account.mjs
// Verify that Profile passes the current tab account type, App serializes it,
// and TransferPage validates and consumes the query parameter.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-transfer-source-account.mjs`
Expected: FAIL because `openTransfer` has no account-type parameter yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// ProfilePage.tsx
onClick={() => openTransfer(currentTab.accountType)}

// App.tsx
const openTransfer = (fromAccountType?: AccountType) => {
  navigate(fromAccountType ? `/transfer?from=${fromAccountType}` : '/transfer');
};

// TransferPage.tsx
const [searchParams] = useSearchParams();
const initialFromAccountType = getInitialFromAccountType(searchParams.get('from'));
const [fromAccountType, setFromAccountType] = useState<AccountType>(initialFromAccountType);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-transfer-source-account.mjs`
Expected: PASS with exit code 0.

- [ ] **Step 5: Verify application build**

Run: `pnpm build`
Expected: PASS with exit code 0.

- [ ] **Step 6: Browser verify**

Open `/profile`, switch to 资金/现货/合约, tap 划转, and verify the transfer page "从" account is 资金账户/现货账户/合约账户 respectively. Overview should keep the existing default.
