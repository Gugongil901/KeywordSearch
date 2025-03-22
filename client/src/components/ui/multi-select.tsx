import React, { useEffect, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  maxItems?: number;
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "항목 선택",
  className,
  maxItems = 5
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedValues || []);

  useEffect(() => {
    setSelected(selectedValues || []);
  }, [selectedValues]);

  const handleSelect = (value: string) => {
    let updatedValues;
    if (selected.includes(value)) {
      updatedValues = selected.filter((item) => item !== value);
    } else {
      if (selected.length >= maxItems) {
        return; // 최대 선택 항목 초과
      }
      updatedValues = [...selected, value];
    }
    setSelected(updatedValues);
    onChange(updatedValues);
  };

  const handleRemove = (value: string) => {
    const updatedValues = selected.filter((item) => item !== value);
    setSelected(updatedValues);
    onChange(updatedValues);
  };

  const selectedLabels = selected.map(
    (value) => options.find((option) => option.value === value)?.label || value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selected.length > 0 ? (
            <div className="flex gap-1 flex-wrap max-w-[90%]">
              {selectedLabels.map((label) => (
                <Badge 
                  variant="secondary" 
                  key={label}
                  className="mr-1 mb-1"
                >
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`${placeholder} 검색...`} />
          <CommandEmpty>선택 가능한 항목이 없습니다</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {selected.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <div className="flex flex-wrap gap-1">
                {selectedLabels.map((label, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="mb-1"
                  >
                    {label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleRemove(selected[index])}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}