# Profile Asset Tab Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the selected profile asset tab during the current app session and reset it after logout.

**Architecture:** Add a small Zustand UI store for the profile asset tab. ProfilePage consumes the store instead of local component state. App observes auth state and resets the tab to overview when the user is logged out.

**Tech Stack:** React 19, Zustand, TypeScript, shadcn/ui Tabs.

## Global Constraints

- Preserve selected tab only in memory for the current app session.
- Do not write the selected profile tab to localStorage.
- Reset selected profile tab to `overview` after logout or auth invalidation.
- Keep existing profile tab labels and layout unchanged.

---

### Task 1: Store Profile Asset Tab

**Files:**
- Create: `src/store/profile-ui.store.ts`
- Modify: `src/pages/profile/ProfilePage.tsx`
- Modify: `src/App.tsx`
- Test: `scripts/check-profile-asset-tab-memory.mjs`

**Interfaces:**
- Produces: `ProfileAssetTab = 'overview' | 'fund' | 'spot' | 'futures'`
- Produces: `useProfileUiStore`
- Consumes: `useProfileUiStore` in ProfilePage and App

- [ ] **Step 1: Write failing static regression check**

Run: `node scripts/check-profile-asset-tab-memory.mjs`
Expected: FAIL until profile tab state is moved to Zustand and reset on logout.

- [ ] **Step 2: Implement the store and consumers**

Create `src/store/profile-ui.store.ts`, replace ProfilePage local `useState` with store selectors, and reset the store from App when `isLogin` is false.

- [ ] **Step 3: Verify**

Run: `node scripts/check-profile-asset-tab-memory.mjs`
Run: `pnpm build`
Use the browser to switch profile tabs, navigate away/back, and confirm the selected tab remains.
