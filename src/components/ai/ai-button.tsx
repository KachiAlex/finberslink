"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AIButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  formAction?: (_formData: FormData) => Promise<unknown>;
  type?: "button" | "submit" | "reset";
  form?: string;
}

export function AIButton({
  children,
  onClick,
  disabled = false,
  className = "",
  variant = "outline",
  size = "default",
  formAction,
  type = "button",
  form,
}: AIButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    if (formAction) {
      // For server actions, we don't handle loading state here
      // The form will handle the submission
      return;
    }

    if (onClick) {
      setIsLoading(true);
      try {
        await onClick();
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (formAction) {
    return (
      <Button
        type="submit"
        formAction={formAction}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        form={form}
        className={`relative ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {children}
      </Button>
    );
  }

  return (
    <Button
      type={type}
      form={form}
      onClick={handleClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={`relative ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/20 rounded-md flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
    </Button>
  );
}
