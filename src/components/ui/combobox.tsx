"use client";

import React from 'react';

export interface ComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  ({ value, onChange, options = [], placeholder = 'Select...', className = '' }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div ref={ref} className={`relative ${className}`}>
        <input
          type="text"
          value={search || value}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
        />
        {open && filtered.length > 0 && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md">
            {filtered.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange?.(option.value);
                  setSearch('');
                  setOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';
