'use client';

import { Icon } from '@iconify/react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const supportedTypes = [
  {
    icon: 'bi:filetype-pdf',
    label: 'PDF',
    description:
      'A file format that preserves document layout and formatting across all devices.',
  },
  {
    icon: 'bi:filetype-txt',
    label: 'TXT',
    description:
      'A plain text file format that stores unformatted text and is widely supported across all devices.',
  },
  {
    icon: 'bi:image',
    label: 'Images',
    description:
      'An image capture of your screen used to quickly share visual information or issues',
  },
];

export function SupportedFileTypes() {
  return (
    <div>
      <h2 className="mb-4 text-lg">Supported File Types</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {supportedTypes.map((type) => (
          <Card
            key={type.label}
            className="max-w-74 border border-[#4a4a46]/90 bg-[#1f1e1d]"
          >
            <CardHeader className="flex flex-col gap-1">
              <Icon icon={type.icon} className="h-6 w-6 text-[#e5e5df]" />
              <div>
                <CardTitle className="mb-1 text-base text-[#a2a19f]">
                  {type.label}
                </CardTitle>
                <CardDescription className="font-light text-[#91918d]">
                  {type.description}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
