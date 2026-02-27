import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = siteConfig.mainNav;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/finbers-logo.png"
            alt="Finbers Link logo"
            width={140}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold tracking-tight uppercase text-primary">
              {siteConfig.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {siteConfig.tagline}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="hidden md:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Launch Platform</Link>
          </Button>
          <MobileNav className="md:hidden" />
        </div>
      </div>
    </header>
  );
}

function MobileNav({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border",
          className
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{siteConfig.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-medium text-muted-foreground transition hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full">
            <Link href="/dashboard">Launch Platform</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
