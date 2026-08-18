import { atom } from "nanostores";

export interface Toast {
  id: number;
  message: string;
  variant: "success" | "error";
  /** Optional undo action; shown as an inline button and extends the timeout. */
  undo?: () => void;
}

export const $toasts = atom<Toast[]>([]);

let nextId = 0;
const DISMISS_MS = 4000;
const DISMISS_WITH_UNDO_MS = 7000;

export function dismissToast(id: number) {
  $toasts.set($toasts.get().filter((toast) => toast.id !== id));
}

export function toast(
  message: string,
  options?: { variant?: "success" | "error"; undo?: () => void },
) {
  const id = ++nextId;
  const entry: Toast = {
    id,
    message,
    variant: options?.variant ?? "success",
    undo: options?.undo,
  };
  $toasts.set([...$toasts.get(), entry]);
  setTimeout(
    () => dismissToast(id),
    entry.undo ? DISMISS_WITH_UNDO_MS : DISMISS_MS,
  );
}
