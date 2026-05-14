'use client';

import { Icon } from '@iconify/react';

import { Combobox } from '@/components/ui/combobox';

const sortOptions = [
  { value: 'Date Uploaded', label: 'Date Uploaded' },
  { value: 'Recent Activity', label: 'Recent Activity' },
  { value: 'File Type', label: 'File Type' },
];

interface UploadHistorySectionProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function UploadHistorySection({
  sortBy,
  onSortChange,
}: UploadHistorySectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg">Upload Files</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-sm text-[#91918d]">Sort By</span>
          <Combobox
            value={sortBy}
            onChange={onSortChange}
            options={sortOptions}
          />
        </div>
      </div>

      <div className="flex min-h-[320px] items-center justify-center rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Icon icon="bi:inbox" className="h-10 w-10 text-[#91918d]" />
          <div>
            <p className="text-base text-white">No files uploaded yet</p>
            <p className="text-sm text-[#91918d]">
              Upload a file above to get started
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
