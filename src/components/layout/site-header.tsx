'use client';

import { FC } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const SiteHeader: FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Finbers Link</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/signin">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
