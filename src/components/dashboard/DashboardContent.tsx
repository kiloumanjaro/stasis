'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

// Bootstrap icon names for Iconify
const UploadIcon = (props: { className?: string }) => (
  <Icon icon="bi:upload" className={props.className} />
);
const BookOpenIcon = (props: { className?: string }) => (
  <Icon icon="bi:book" className={props.className} />
);
const FlameIcon = (props: { className?: string }) => (
  <Icon icon="bi:fire" className={props.className} />
);
const ClockIcon = (props: { className?: string }) => (
  <Icon icon="bi:clock" className={props.className} />
);

const stats = [
  {
    title: 'Total Cards',
    value: '0',
    description: 'Cards created',
    icon: BookOpenIcon,
  },
  {
    title: 'Study Streak',
    value: '0',
    description: 'Days in a row',
    icon: FlameIcon,
  },
  {
    title: 'Time Spent',
    value: '0h',
    description: 'Total study time',
    icon: ClockIcon,
  },
];

export function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Learning Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload CTA */}
      <Card className="flex flex-col items-center border border-[#4a4a46] bg-[#30302e]">
        <CardHeader className="flex flex-col items-center pt-9">
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Upload your study materials to generate flashcards with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-9">
          <Button
            asChild
            variant="ghost"
            className="w-48 items-center rounded-2xl text-[#191919]"
          >
            <Link href="/upload">
              <UploadIcon className="mr-2 h-5 w-5" />
              Upload Materials
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-none bg-[#0f0f0f] px-4 py-2">
        <CardHeader>
          <div className="flex flex-row justify-between">
            <div className="flex w-1/2 items-center">
              <Image
                src="/images/green.png"
                alt="Stasis"
                className="h-12 w-12"
                width={48}
                height={48}
              />
              <CardTitle className="text-3xl font-normal">statis</CardTitle>
            </div>
            <div className="flex w-1/2 flex-col gap-2">
              <CardTitle className="font-normal">Recent Activity</CardTitle>
              <CardDescription>
                Your learning history will appear here
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between">
            {/* Left Column: Info */}
            <div className="flex w-1/2 flex-col justify-between space-y-2 pb-3 text-sm text-muted-foreground">
              <p className="ml-3 max-w-md">
                Track your study sessions and progress here. Your recent
                flashcard reviews and learning milestones will be displayed.
              </p>
            </div>

            {/* Right Column: Activity Area */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[#4a4a46]/50 bg-[#191919]">
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <BookOpenIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No activity yet. Start by uploading your first study material!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
