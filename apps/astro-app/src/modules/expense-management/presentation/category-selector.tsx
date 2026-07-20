"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import type { Category } from "@/shared/domain/category";
import { CATEGORIES } from "@/shared/configuration/category";

interface CategorySelectorProps {
  value?: Category;
  onValueChange: (category: Category) => void;
  suggestedCategory?: Category;
}

export function CategorySelector({
  value,
  onValueChange,
  suggestedCategory,
}: CategorySelectorProps) {
  return (
    <Field>
      <FieldLabel>Category</FieldLabel>
      <FieldContent>
        {suggestedCategory && suggestedCategory !== value && (
          <FieldDescription>
            Suggested: <span className="font-medium">{suggestedCategory}</span>
          </FieldDescription>
        )}
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldContent>
    </Field>
  );
}
