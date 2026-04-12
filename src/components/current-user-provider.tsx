'use client';

import { createContext, useContext, ReactNode, FC } from 'react';

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

interface CurrentUserContextType {
  user: CurrentUser | null;
  loading: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

interface CurrentUserProviderProps {
  children: ReactNode;
  user?: CurrentUser | null;
}

export const CurrentUserProvider: FC<CurrentUserProviderProps> = ({
  children,
  user = null,
}) => {
  return (
    <CurrentUserContext.Provider value={{ user, loading: false }}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserId = (): string | null => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    return null;
  }
  return context.user?.id || null;
};
