"use client";

/** TEMPORARY visual harness for /impeccable critique — delete after. */

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { DashboardContent } from "../dashboard-content";
import type { Expense } from "@/modules/expense-management/domain/expense";
import type { RecurringPayment } from "@/modules/recurring-payments/domain/recurring-payment";
import type { Category } from "@/shared/domain/category";

const PAYEES: [string, Category, number][] = [
  ["Whole Foods", "Groceries", 67.93],
  ["Shell", "Fuel", 48.2],
  ["Netflix", "Streaming", 15.49],
  ["Bella Trattoria", "Dining", 42.1],
  ["City Water", "Water", 31.4],
  ["Main St. Apt", "Rent", 1450],
  ["Comcast", "Internet", 79.99],
  ["PowerCo", "Electricity", 96.35],
  ["Odeon", "Entertainment", 24.0],
  ["Trader Joe's", "Groceries", 54.12],
  ["Dr. Vance", "Medical", 120.0],
  ["Allstate", "Insurance", 88.4],
];

const buildExpenses = (): Expense[] => {
  const rows: Expense[] = [];
  let seed = 7;
  const next = () =>
    (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

  const months = [
    "2025-05",
    "2025-06",
    "2025-07",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
  ];

  for (const month of months) {
    const count = month === "2026-07" ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const [name, category, base] = PAYEES[Math.floor(next() * PAYEES.length)];
      const day = String(
        1 + Math.floor(next() * (month === "2026-07" ? 23 : 27)),
      ).padStart(2, "0");
      rows.push({
        id: `${month}-${i}`,
        amount: Math.round(base * (0.7 + next() * 0.8) * 100) / 100,
        date: `${month}-${day}`,
        provider_name: name,
        description: null,
        category,
        created_at: `${month}-${day}T10:00:00Z`,
      });
    }
  }
  return rows;
};

const RECURRING: RecurringPayment[] = [
  {
    id: "r1",
    amount: 1450,
    provider_name: "Rent – Main St. Apt",
    description: null,
    category: "Rent",
    frequency: "monthly",
    next_due_date: "2026-07-27",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "r2",
    amount: 10.99,
    provider_name: "Spotify Premium",
    description: null,
    category: "Streaming",
    frequency: "monthly",
    next_due_date: "2026-07-28",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "r3",
    amount: 49,
    provider_name: "Gym Membership",
    description: null,
    category: "Entertainment",
    frequency: "monthly",
    next_due_date: "2026-08-01",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "r4",
    amount: 1.99,
    provider_name: "Google One",
    description: null,
    category: "Internet",
    frequency: "monthly",
    next_due_date: "2026-08-04",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "r5",
    amount: 15.49,
    provider_name: "Netflix",
    description: null,
    category: "Streaming",
    frequency: "monthly",
    next_due_date: "2026-08-09",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "r6",
    amount: 22.5,
    provider_name: "Car Wash Club",
    description: null,
    category: "Fuel",
    frequency: "monthly",
    next_due_date: "2026-08-15",
    created_at: "2026-01-01T00:00:00Z",
  },
];

queryClient.setQueryDefaults(["expenses"], {
  queryFn: async () => buildExpenses(),
});
queryClient.setQueryData(["expenses"], buildExpenses());
queryClient.setQueryDefaults(["recurring-payments"], {
  queryFn: async () => RECURRING,
});
queryClient.setQueryData(["recurring-payments"], RECURRING);
queryClient.setQueryData(["custom-categories"], []);
queryClient.setQueryData(["profiles"], []);

const rootRoute = createRootRoute({ component: () => <Outlet /> });
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) ?? "dashboard",
    view: (search.view as string) ?? "list",
  }),
  component: () => <DashboardContent />,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([appRoute]),
  history: createMemoryHistory({ initialEntries: ["/app?tab=dashboard"] }),
});

export default function DashboardPreview() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <RouterProvider router={router as any} />;
}
