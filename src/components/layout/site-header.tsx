"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = siteConfig.mainNav;

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 transition-all duration-300",
        "backdrop-blur-xl",
        isScrolled ? "bg-white/95 shadow-lg shadow-slate-900/5" : "bg-white/70"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/finbers-logo.png"
            alt="Finbers Link logo"
            width={140}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-4 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-2 py-1 transition-colors duration-200",
                "after:absolute after:inset-x-2 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 after:content-['']",
                "hover:text-primary hover:after:scale-x-100",
                pathname === item.href && "text-primary after:scale-x-100"
              )}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <Button asChild className="px-5">
            <Link href="/dashboard">Launch Platform</Link>
          </Button>
          <MobileNav
            className="md:hidden"
            isOpen={isMobileNavOpen}
            onOpenChange={setIsMobileNavOpen}
            pathname={pathname}
          />
        </div>
      </div>
    </header>
  );
}

function MobileNav({
  className,
  isOpen,
  onOpenChange,
  pathname,
}: {
  className?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string | null;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border",
          className
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 border-l border-slate-200 bg-white/95">
        <div className="mt-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className={cn(
                "rounded-2xl border border-transparent bg-slate-50/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 transition",
                "hover:border-primary/30 hover:bg-white hover:text-primary",
                pathname === item.href && "border-primary/40 bg-white text-primary shadow-sm"
              )}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.title}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full" onClick={() => onOpenChange(false)}>
            <Link href="/dashboard">Launch Platform</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
