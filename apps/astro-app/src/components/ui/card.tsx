import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Edge treatments are a rule, not a preference, so the page doesn't read as
 * two systems: a top-level card lifts off the page with `ring-1`, anything
 * subdividing the inside of one sits flat with `border`, and `EmptyState`'s
 * dashed border is the third case on purpose — dashed says "a thing belongs
 * here and doesn't exist yet", which neither of the others can say.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A card's title is a real heading by default.
 *
 * It used to render a `<div>`, which meant a page of five titled cards had a
 * heading outline of one item — the greeting — and a screen-reader user could
 * not jump to any card at all. The level is a prop rather than fixed so a card
 * nested under an `h2` section can drop to `h3` without the visual changing.
 */
function CardTitle({
  className,
  as: Tag = "h2",
  ...props
}: React.ComponentProps<"div"> & {
  as?: "h2" | "h3" | "h4" | "div";
}) {
  return (
    <Tag
      data-slot="card-title"
      className={cn("text-base leading-snug font-medium", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-4", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
