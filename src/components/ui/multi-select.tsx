"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export type MultiSelectOption = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between",
            !selected.length && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedLabels.map((label) => (
                <Badge key={label} variant="secondary" className="mr-1 gap-1">
                  {label}
                  <span
                    className="ring-offset-background hover:bg-muted ml-1 cursor-pointer rounded-full outline-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const option = options.find((opt) => opt.label === label);
                      if (option) handleRemove(option.value);
                    }}
                  >
                    <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="max-h-64 overflow-x-hidden overflow-y-auto p-1">
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm">No options available</div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5"
                onClick={() => handleSelect(option.value)}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => handleSelect(option.value)}
                />
                <label className="flex-1 cursor-pointer text-sm">
                  {option.label}
                </label>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
