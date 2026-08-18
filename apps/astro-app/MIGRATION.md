# Architecture migration — port to gon-stack layout

Tracker branch for the astro-app refactor onto the gon-stack module architecture.
This branch is the **accumulator**: child PRs are reviewed against their immediate
parent branch and merge up the chain. Nothing lands in `main` until the whole
chain is green. **Do not review the aggregate diff here** — review each child PR.

## Target architecture (delivered)

```
src/
├── core/          # composition root (orchestrators) — replaced kernel/ + shells/
│   ├── layouts/ · modules/ (app, login, register) · style/
├── libs/          # domain-agnostic, copy-pasteable
│   ├── ui/ (shadCN primitives + generic atoms) · api/ (api-client, query-client)
├── modules/<f>/   # contracts · core · configuration · integration · presentation
├── server/        # application/{adapter,core,procedures} + domain  (+ black-box tests)
├── shared/        # app-owned cross-cutting
│   ├── auth · data-sources · server-contracts · routing · format
│   └── money · statistics · categories · calendar · records · recurring  (domain atoms)
└── pages/         # thin; api/* delegate to server procedures; /app/<tab> path routes
```

## Chain — all children open

```
main
 └── refactor/gon-stack-arch                 (this tracker, PR #6, draft)
      └── 01 libs/ui + kill theme            PR #7   ✅
           └── 02 shared infra               PR #8   ✅
                └── 03 shared/<domain>        PR #9   ✅
                     └── 04 server/           PR #10  ✅ (size:exception)
                          └── 05 procedure tests  PR #11  ✅
                               └── 06 core/         PR #12  ✅
                                    └── 07 tab paths   PR #13  ✅
```

## Status

| PR | Scope | Item(s) | Status |
|----|-------|---------|--------|
| [#7](https://github.com/Adamchello/expense-hub/pull/7)  | `libs/ui` + remove theme switching | 1, 7 | ✅ Open |
| [#8](https://github.com/Adamchello/expense-hub/pull/8)  | `shared/` auth · data-sources · contracts; remove `kernel/` | 5 | ✅ Open |
| [#9](https://github.com/Adamchello/expense-hub/pull/9)  | `shared/<domain>`; delete `components/` | 2 | ✅ Open |
| [#10](https://github.com/Adamchello/expense-hub/pull/10) | server procedure layer | 3, 6 | ✅ Open |
| [#11](https://github.com/Adamchello/expense-hub/pull/11) | black-box procedure tests | 3, 4 | ✅ Open |
| [#12](https://github.com/Adamchello/expense-hub/pull/12) | `core/` orchestrators, remove `shells/` | 8 | ✅ Open |
| [#13](https://github.com/Adamchello/expense-hub/pull/13) | tabs `?tab=` → path params | 9 | ✅ Open |

**Note:** a speculative "modules restructure" phase was dropped — the feature
modules already conformed to the `contracts·core·configuration·integration·presentation`
layout, so restructuring them would have been churn with no gain.

## Merge order
Merge bottom-up: `#7 → #8 → #9 → #10 → #11 → #12 → #13`, retargeting each to
`main` (or to the tracker branch) as its parent merges, then close the tracker.
