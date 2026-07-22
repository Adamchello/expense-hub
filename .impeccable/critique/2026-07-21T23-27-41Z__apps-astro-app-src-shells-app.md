---
target: app
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-21T23-27-41Z
slug: apps-astro-app-src-shells-app
---

## Design Health Score

| #     | Heuristic                   | Score | Key Issue                                                                |
| ----- | --------------------------- | ----- | ------------------------------------------------------------------------ |
| 1     | Visibility of System Status | 3     | Toasts/skeletons good, but active tab never in URL                       |
| 2     | Match System / Real World   | 2     | "Incoming Payments" labels money going OUT (bills owed) as incoming      |
| 3     | User Control & Freedom      | 3     | Undo-on-delete excellent; tab nav bypasses router, browser Back dead     |
| 4     | Consistency & Standards     | 2     | Two tab patterns, two Settings screens, spinner vs skeleton, dead helper |
| 5     | Error Prevention            | 3     | Delete confirms, max date, maxLength — solid                             |
| 6     | Recognition over Recall     | 3     | Grouped nav, category chips, month grouping                              |
| 7     | Flexibility & Efficiency    | 2     | No hotkey for Add Expense, no type-ahead category picker                 |
| 8     | Aesthetic & Minimalist      | 3     | Genuinely calm and restrained — on-brief                                 |
| 9     | Error Recovery              | 3     | Clear inline messages; no retry on load failure                          |
| 10    | Help & Documentation        | 2     | First-run empty state teaches; History/Analytics empty states bare       |
| Total |                             | 26/40 | Acceptable — solid build, consistency + a11y gaps hold it back           |

## Anti-Patterns Verdict

Partially AI-looking — three real tells: (1) dead code initialsOf() in profile-switcher.tsx:16 never called; (2) two Settings implementations — routed settings-page.tsx renders a single-tab Tabs (meaningless) while real settings are stacked cards in dashboard-content.tsx:254; (3) two tab vocabularies — Radix Tabs for nav vs hand-rolled role=tablist grid/calendar toggle in recurring-payments.

Detector: 1 finding, border-accent-on-rounded at file-drop-zone.tsx:87 — CONFIRMED FALSE POSITIVE (rounded-full border-b-2 animate-spin loading spinner, not a side-stripe). 0 genuine detector issues. Structural slop (dead code, duplicated screens) is invisible to a CSS-pattern scanner; only surfaces on a real read.

Visual overlays: none. No dev server on :4321, app surface withAuth-gated. Justified fallback.

## Overall Impression

Calm, competent product that mostly earns its familiarity. Biggest opportunity: it violates its own founding principle — built as "a record, not a verdict," yet Analytics paints overspending red. Fix the contradictions (verdict coloring, invisible focus, two-Settings mess) and it jumps a trust band.

## What's Working

1. The add-expense hierarchy IS the product — autoFocus hero amount, payee/date/note behind disclosure, category auto-suggest from payee. Honors "under 10 seconds" in structure.
2. Undo instead of dread — single + bulk delete recreate from client snapshots via toast Undo (expense-history.tsx:135) rather than a scary modal.
3. A real token system — full light+dark OKLCH green palette, one consistent ring-1 ring-foreground/10 card treatment everywhere.

## Priority Issues

[P1] Analytics "verdict" violates core brand principle. Increased spending renders red/destructive, decreased green (spending-analytics.tsx:284). PRODUCT.md: "a record, not a verdict." Mint/YNAB anti-reference leaking in. Fix: neutral delta + directional arrow, drop red/green semantic. Command: quieter.

[P1] Keyboard focus invisible on the two most-used surfaces. History cards (expense-history.tsx:195) and calendar day cells are role=button tabIndex=0 with only hover: styles, no focus-visible ring. WCAG 2.4.7 failure vs stated AA. Fix: add focus-visible:ring-2 ring-ring ring-offset-2. Command: harden.

[P2] History filter bar is a 6-control wall. search+month+category+sort+clear+export in one row (expense-history.tsx:261), fixed w-40/w-64 overflow on 375px. Fix: search full-width, fold sort+export into overflow. Command: layout.

[P2] No prefers-reduced-motion path. Dialog/popover/select zoom+fade and animate-pulse run unconditionally. PRODUCT.md requires reduced-motion alt for every animation. Fix: global reduced-motion block in global.css. Command: animate.

[P2] Navigation is stateful, not routed. activeTab is useState (dashboard-content.tsx:63); TanStack Router installed but only serves /app + orphaned /settings. No deep-link, Back, or reload persistence. Fix: drive tab from route/search param, delete dead settings-page.tsx. Command: clarify.

## Persona Red Flags

Alex (power user): no global hotkey for Add Expense, no type-ahead category picker, payee behind "Add details" outside initial tab order.

Sam (a11y): invisible focus ring (P1) is headline. CardActionsMenu trigger ~24px (below 44px), on mobile it's the primary edit/delete affordance. AddExpenseDialog has DialogTitle but no DialogDescription — Radix missing-aria-describedby warning.

Casey (mobile): FAB well-placed (56px thumb zone). But 24px menu worst target, fixed-width selects tower, no state persistence — reload drops tab + filters.

## Minor Observations

- Amount validation silently returns on invalid input — user sees nothing on Save.
- muted-foreground oklch(0.53 0.018 150) at 9-11px (calendar chips, +N) borderline 4.5:1; fails AA at those sizes. Contrast pass needed.
- Profile switcher uses Loader2 spinner where everything else uses SkeletonList; expense-row skeleton reused for chart-heavy Analytics.
- Second orphan: ExpenseEntryForm dialog wrapper duplicating AddExpenseDialog.

## Questions to Consider

1. If speed of entry is the product, why is the first touch a modal with a Single/Import tab fork? What would an always-inline quick-add row cost?
2. Calmest color system in the category, used to tell people they spent too much. What does "a record, not a verdict" look like in pixels?
3. Whole app is useState, not URL — every tab/filter evaporates on reload. Deliberate, or path of least resistance?
