"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/70 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-semibold">Finbers Link</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-semibold md:flex">
          <Link href="/courses" className="text-muted-foreground hover:text-foreground">
            Courses
          </Link>
          <Link href="/jobs" className="text-muted-foreground hover:text-foreground">
            Jobs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
