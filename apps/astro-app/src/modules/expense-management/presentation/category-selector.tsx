"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/libs/ui/select";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/libs/ui/field";
import type { Category } from "@/shared/categories/category";
import { CATEGORIES } from "@/shared/categories/configuration";

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
