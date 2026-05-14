'use client';

import { useMemo, useState } from 'react';
import { Popover } from 'radix-ui';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            'flex min-w-[180px] items-center justify-between rounded-lg border border-[#333] bg-[#2a2a2a] px-3 py-2 text-sm text-white outline-none transition-colors',
            className
          )}
        >
          <span>{selectedOption?.label ?? 'Select option'}</span>
          <ChevronsUpDown className="h-4 w-4 text-[#91918d]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="z-50 w-[220px] rounded-lg border border-[#333] bg-[#2a2a2a] p-1 shadow-lg"
        >
          <div className="flex flex-col">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm text-white transition-colors hover:bg-[#30302e]"
                >
                  <span>{option.label}</span>
                  <Check
                    className={cn(
                      'h-4 w-4 text-[#e5e5df]',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
