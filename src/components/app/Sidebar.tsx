// MOBILE NAV REFACTOR — sidebar → top bar

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  LogOut,
  Map,
  MoreHorizontal,
  Scan,
  Settings,
  Timer,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOBILE_PRIMARY_HREFS = ['/dashboard', '/roadmap', '/pomodoro'] as const;
const MOBILE_PRIMARY_HREF_SET = new Set<string>(MOBILE_PRIMARY_HREFS);

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { href: '/cv', label: 'Emotion AI', icon: Scan },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  user: User | null;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileNavLink({
  href,
  icon: Icon,
  isActive,
  label,
  onClick,
}: NavItem & {
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
      className={cn(
        'flex h-14 min-w-16 flex-1 items-center justify-center border-t-2 px-2 transition-colors',
        isActive
          ? 'border-accent font-semibold text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
    </Link>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const mobilePrimaryItems = MOBILE_PRIMARY_HREFS.map(
    (href) => navItems.find((item) => item.href === href)!
  );

  const overflowMobileItems = [
    ...navItems
      .filter((item) => !MOBILE_PRIMARY_HREF_SET.has(item.href))
      .map((item) => ({ type: 'link' as const, ...item })),
    ...(user
      ? [
          {
            type: 'action' as const,
            label: 'Sign out',
            icon: LogOut,
          },
        ]
      : []),
  ];
  const isOverflowActive = overflowMobileItems.some(
    (item) => item.type === 'link' && isActivePath(pathname, item.href)
  );

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isMoreOpen]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden">
        <nav className="flex" aria-label="Primary">
          {mobilePrimaryItems.map((item) => (
            <MobileNavLink
              key={item.href}
              {...item}
              isActive={isActivePath(pathname, item.href)}
            />
          ))}

          <div ref={moreMenuRef} className="relative flex h-14 min-w-16 flex-1">
            <button
              type="button"
              aria-expanded={isMoreOpen}
              aria-haspopup="menu"
              aria-label="More"
              title="More"
              onClick={() => setIsMoreOpen((open) => !open)}
              className={cn(
                'flex h-full w-full items-center justify-center border-t-2 px-2 transition-colors',
                isOverflowActive || isMoreOpen
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
            </button>

            {isMoreOpen && (
              <div className="fixed bottom-16 right-2 z-50 min-w-44 rounded-md border border-border bg-card p-1 shadow-lg">
                <div
                  className="flex flex-col"
                  role="menu"
                  aria-label="More navigation"
                >
                  {overflowMobileItems.map((item) => {
                    if (item.type === 'action') {
                      const Icon = item.icon;
                      return (
                        <form
                          key={item.label}
                          action="/auth/logout"
                          method="post"
                        >
                          <button
                            type="submit"
                            role="menuitem"
                            className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        </form>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setIsMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent',
                          isActivePath(pathname, item.href)
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      <aside className="hidden w-16 flex-col bg-[#0f0f0f] md:flex">
        <div className="flex h-16 items-center justify-center">
          <Link href="/dashboard" title="StudyAI">
            <Image
              src="/images/green.png"
              alt="StudyAI"
              width={45}
              height={45}
            />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'flex items-center justify-center rounded-lg p-3 transition-colors',
                  isActive
                    ? 'text-[#f0f0eb]'
                    : 'text-[#bfbfba] hover:text-[#f0f0eb]'
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-2">
            <form
              action="/auth/logout"
              method="post"
              className="flex justify-center"
            >
              <Button
                className="bg-none"
                size="icon"
                type="submit"
                title="Sign out"
              >
                <LogOut className="h-10 w-10" />
              </Button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
