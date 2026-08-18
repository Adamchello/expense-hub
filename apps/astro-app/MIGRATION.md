# Architecture migration — port to gon-stack layout

Tracker branch for the astro-app refactor onto the gon-stack module architecture.
This branch is the **accumulator**: child PRs are reviewed against their immediate
parent branch and merge up the chain. Nothing lands in `main` until the whole
chain is green. **Do not review the aggregate diff here** — review each child PR.

## Target architecture

```
src/
├── core/          # composition root (orchestrators) — replaces kernel/ + shells/
├── libs/          # domain-agnostic, copy-pasteable (ui, eda, api)
├── modules/<f>/   # feature modules: contracts · core · configuration · integration · presentation
├── server/        # backend: application/{adapter,core,procedures} + domain
├── shared/        # app-owned cross-cutting: auth, data-sources, server-contracts, <domain>/
└── pages/         # thin routing shells; api/* delegate to server procedures
```

## Chain

```
main
 └── refactor/gon-stack-arch                 (this tracker, draft, no-merge)
      └── 01 libs/ui + kill theme            items 1, 7
           └── 02 shared/                     items 5, 8 (removes kernel)
                └── 03 server/ procedures     items 3, 6 (black-box tests)
                     └── 04 modules            layered restructure
                          └── 05 core/         item 8 (replaces shells)
                               └── 06 tabs     item 9 (path params)
                                    └── 07 cleanup
```

## Status

| PR | Scope | Status |
|----|-------|--------|
| 01 | `libs/ui` + remove theme switching | 🟡 Open |
| 02 | `shared/` (auth, data-sources, contracts, domain); remove `kernel/` | ⚪ Pending |
| 03 | `server/` procedure factory + procedures + black-box unit tests | ⚪ Pending |
| 04 | modules → layered structure | ⚪ Pending |
| 05 | `core/` orchestrators, replace `shells/` | ⚪ Pending |
| 06 | tabs `?tab=` → path params `/app/<tab>` + nested view | ⚪ Pending |
| 07 | cleanup: delete `components/`, dead tokens | ⚪ Pending |
