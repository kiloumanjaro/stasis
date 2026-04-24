import Image from 'next/image';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';

interface FeatureFooterCardProps {
  title: string;
  description: string;
  leftContent: ReactNode;
  rightContent: ReactNode;
  className?: string;
  leftColumnClassName?: string;
  rightColumnClassName?: string;
  brandName?: string;
  brandImageSrc?: string;
  brandImageAlt?: string;
}

export function FeatureFooterCard({
  title,
  description,
  leftContent,
  rightContent,
  className,
  leftColumnClassName,
  rightColumnClassName,
  brandName = 'statis',
  brandImageSrc = '/images/green.png',
  brandImageAlt = 'Stasis',
}: FeatureFooterCardProps) {
  return (
    <Card className={cn('border-none bg-[#0f0f0f] px-4 py-2', className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col gap-6 md:w-1/2">
            <div className="flex items-center">
              <Image
                src={brandImageSrc}
                alt={brandImageAlt}
                className="h-12 w-12"
                width={48}
                height={48}
              />
              <CardTitle className="text-3xl font-normal">
                {brandName}
              </CardTitle>
            </div>
            <div
              className={cn(
                'flex flex-col justify-between space-y-2 pb-3 text-sm text-muted-foreground',
                leftColumnClassName
              )}
            >
              {leftContent}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <CardTitle className="font-normal">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div
              className={cn(
                'flex flex-1 flex-col overflow-hidden rounded-lg border border-[#4a4a46]/50 bg-[#191919]',
                rightColumnClassName
              )}
            >
              {rightContent}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
