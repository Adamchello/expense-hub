"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

export interface CardAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

interface CardActionsMenuProps {
  /** Accessible name for the trigger, e.g. "Actions for Netflix". */
  label: string;
  actions: CardAction[];
}

/**
 * The ⋯ menu used by card grids: hidden until the card is hovered on
 * pointer devices, always visible on touch. Clicks never bubble to the card.
 */
export function CardActionsMenu({ label, actions }: CardActionsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-100 transition-opacity hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-36 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              action.destructive
                ? "text-destructive hover:bg-destructive/10"
                : "hover:bg-accent",
            )}
            onClick={action.onClick}
          >
            <action.icon className="size-3.5" />
            {action.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
