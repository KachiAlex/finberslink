"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

export function ChatAvatar({ user }: any) {
  return (
    <Avatar>
      <AvatarImage src={user?.image} alt={user?.name} />
      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
    </Avatar>
  );
}
