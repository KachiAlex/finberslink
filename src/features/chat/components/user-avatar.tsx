"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../../../components/ui/avatar";

export function UserAvatar({ user }: any) {
  return (
    <Avatar>
      <AvatarImage src={user?.image} alt={user?.name} />
      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
    </Avatar>
  );
}
