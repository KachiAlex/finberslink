"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  isOnline?: boolean;
}

const sizeMap = {
  xs: { container: "h-6 w-6", text: "text-xs", ring: "h-2 w-2" },
  sm: { container: "h-8 w-8", text: "text-sm", ring: "h-2.5 w-2.5" },
  md: { container: "h-10 w-10", text: "text-sm", ring: "h-3 w-3" },
  lg: { container: "h-12 w-12", text: "text-base", ring: "h-3.5 w-3.5" },
};

export function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  size = "md",
  className,
  isOnline,
}: UserAvatarProps) {
  const sizes = sizeMap[size];
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
        ? firstName[0].toUpperCase()
        : "?";

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center",
          sizes.container
        )}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${firstName} ${lastName}`}
            fill
            className="object-cover"
          />
        ) : firstName || lastName ? (
          <span className={cn("font-semibold text-white leading-none", sizes.text)}>
            {initials}
          </span>
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            sizes.ring,
            isOnline ? "bg-green-500" : "bg-slate-400"
          )}
        />
      )}
    </div>
  );
}
