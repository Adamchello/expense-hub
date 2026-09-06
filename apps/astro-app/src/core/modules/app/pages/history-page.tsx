"use client";

import { useNavigate } from "@tanstack/react-router";
import { appTabPath, type HistoryView } from "@/shared/routing/app-router";
import { History } from "@/modules/history/presentation/history";

/** History renders its own title beside its view switch. */
export function HistoryPage({ view }: { view: HistoryView }) {
  const navigate = useNavigate();

  return (
    <History
      view={view}
      onViewChange={(next) =>
        navigate({ to: appTabPath("history", next), replace: true })
      }
    />
  );
}
