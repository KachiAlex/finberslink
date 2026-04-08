"use client";

import React, { createContext, useContext } from "react";

const CurrentUserContext = createContext<string | null>(null);

export function CurrentUserProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={userId}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUserId() {
  return useContext(CurrentUserContext);
}
