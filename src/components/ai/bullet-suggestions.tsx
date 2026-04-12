'use client';

import { FC } from 'react';

interface BulletSuggestionsProps {
  suggestions?: string[];
  onSelect?: (suggestion: string) => void;
}

export const BulletSuggestions: FC<BulletSuggestionsProps> = ({
  suggestions = [],
  onSelect,
}) => {
  return (
    <div className="space-y-2">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="p-2 border rounded cursor-pointer hover:bg-gray-100"
          onClick={() => onSelect?.(suggestion)}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
};
