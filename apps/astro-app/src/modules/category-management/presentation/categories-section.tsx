"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Callout,
  CategoryBadge,
  DataList,
  errorMessage,
} from "@/components/shared";
import {
  COLOR_PRESETS,
  PRESET_COLOR_CLASSES,
  PRESET_COLOR_HEX,
} from "@/shared/configuration/category";
import {
  useCustomCategories,
  useCreateCustomCategory,
  useDeleteCustomCategory,
} from "../core/store";
import { Trash2 } from "lucide-react";

export function CategoriesSection() {
  const [name, setName] = useState("");
  const [color, setColor] = useState("gray");

  const query = useCustomCategories();
  const createMutation = useCreateCustomCategory();
  const deleteMutation = useDeleteCustomCategory();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
          setColor("gray");
        },
      },
    );
  };

  const customs = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Categories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Add your own categories on top of the built-in ones. They appear in
          every category picker for this profile.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-2"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-category-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="new-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daycare"
              maxLength={30}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-category-color" className="text-sm font-medium">
              Color
            </label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="new-category-color" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: PRESET_COLOR_HEX[preset] }}
                      />
                      {preset}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            loading={createMutation.isPending}
            disabled={!name.trim()}
          >
            {createMutation.isPending ? "Adding..." : "Add Category"}
          </Button>
        </form>

        {createMutation.error && (
          <Callout variant="error">
            {errorMessage(createMutation.error, "Failed to create category")}
          </Callout>
        )}

        {customs.length > 0 && (
          <DataList>
            {customs.map((custom) => (
              <li
                key={custom.id}
                className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
              >
                <CategoryBadge
                  category={custom.name}
                  colorClassName={
                    PRESET_COLOR_CLASSES[custom.color] ??
                    PRESET_COLOR_CLASSES.gray
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete category ${custom.name}`}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(custom.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </DataList>
        )}
      </CardContent>
    </Card>
  );
}
