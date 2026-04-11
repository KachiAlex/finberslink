"use client";

import React, { createContext, useContext } from "react";

const CurrentUserContext = createContext<any>(null);

export function CurrentUserProvider({ children, user }: any) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}


export function useCurrentUserId() {
  const user = useCurrentUser();
  return user?.id;
}
