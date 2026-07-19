"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryOptions } from "../core/use-category-options";

interface CategoryPickerPopoverProps {
  value: string | undefined;
  onSelect: (category: string) => void;
}

/** Grouped category picker (built-ins + customs) shared by bill forms. */
export function CategoryPickerPopover({
  value,
  onSelect,
}: CategoryPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { groups } = useCategoryOptions();

  return (
    <Popover modal open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Category"
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {value ?? "Choose a category"}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="w-(--radix-popover-trigger-width) min-w-80 p-3"
      >
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={value === category}
                    onClick={() => {
                      onSelect(category);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      value === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
