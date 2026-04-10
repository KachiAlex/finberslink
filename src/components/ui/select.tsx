"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children?: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, children, placeholder, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <SelectTrigger className={className} onClick={() => setIsOpen(!isOpen)}>
        {value || placeholder}
        <ChevronDown className="h-4 w-4 ml-auto" />
      </SelectTrigger>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SelectContent({ children }: SelectContentProps) {
  return <div className="py-1">{children}</div>;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <div
      className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
      onClick={() => {
        const select = document.querySelector('[data-select]');
        if (select) {
          const event = new CustomEvent('selectChange', { detail: value });
          select.dispatchEvent(event);
        }
      }}
    >
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="block truncate">{placeholder}</span>;
}
