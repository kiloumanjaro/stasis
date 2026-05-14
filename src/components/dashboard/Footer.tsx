import Image from 'next/image';
import Link from 'next/link';

import { Footnote } from '@/components/dashboard/Footnote';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const footerSections = [
  {
    heading: 'Workspace',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/upload', label: 'Upload' },
    ],
  },
  {
    heading: 'Tools',
    links: [
      { href: '/cv', label: 'CV Monitor' },
      { href: '/pomodoro', label: 'Pomodoro' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/profile', label: 'Profile' },
      { href: '/settings', label: 'Settings' },
    ],
  },
] as const;

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer>
      <Card className={cn('border-none bg-[#0f0f0f] px-4 py-2', className)}>
        <CardContent className="flex flex-col gap-16 p-8 md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="flex max-w-xl flex-col gap-6 md:w-1/2">
              <div className="flex items-center">
                <Image
                  src="/images/green.png"
                  alt="Stasis"
                  className="h-12 w-12"
                  width={48}
                  height={48}
                />
                <CardTitle className="text-3xl font-normal">stasis</CardTitle>
              </div>

              <div className="space-y-3 pb-3 text-sm text-muted-foreground">
                <p className="ml-3 max-w-md">
                  Stasis provides a focused learning workspace designed to keep
                  study sessions structured, measurable, and calm.
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-10">
              <div className="flex flex-col gap-2">
                <CardTitle className="font-normal">Quick access</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use these links to move through your workspace and account
                  settings efficiently.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {footerSections.map((section) => (
                  <div key={section.heading} className="space-y-3">
                    <h2 className="text-sm font-medium text-white">
                      {section.heading}
                    </h2>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Footnote />
        </CardContent>
      </Card>
    </footer>
  );
}
