'use client';

import type { CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      position="top-center"
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        style: {
          '--width': 'max-content',
          width: 'max-content',
          maxWidth: 'calc(100vw - 2rem)',
        } as CSSProperties,
        classNames: {
          toast:
            'group toast max-w-[calc(100vw-2rem)] !border-[#2e2f2f] !bg-[#0f0f0f] !px-5 group-[.toaster]:border group-[.toaster]:text-foreground group-[.toaster]:shadow-lg',
          content: 'min-w-0 flex-1',
          title:
            'block min-w-0 max-w-full whitespace-nowrap !font-normal group-[.toast]:text-foreground',
          description:
            'block min-w-0 max-w-full whitespace-nowrap !font-normal group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
