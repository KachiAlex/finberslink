"use client";

export function useToast() {
  return {
    toast: (options: any) => {},
    toasts: [] as any[],
  };
}
