'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Map,
  Timer,
  LogOut,
  Menu,
  X,
  Scan,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { User } from '@supabase/supabase-js';

const navItems = [
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-16 flex-col bg-[#0f0f0f] transition-transform duration-300 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
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

        {/* User section */}
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
