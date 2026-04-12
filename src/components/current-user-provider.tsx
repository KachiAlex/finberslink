import React from 'react';

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useCurrentUserId() {
  return '';
}
