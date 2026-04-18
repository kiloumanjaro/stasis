'use client';

import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Milestone, RoadmapContentProps } from '@/types/roadmap';
import Link from 'next/link';

// Default placeholder milestones for empty state/fallback
const DEFAULT_PLACEHOLDER_MILESTONES: Milestone[] = [
  {
    id: 'placeholder-1',
    title: 'Getting Started',
    description: 'Upload your first study material',
    status: 'pending',
    order: 1,
    cards: 0,
  },
  {
    id: 'placeholder-2',
    title: 'Module 1',
    description: 'Introduction concepts',
    status: 'pending',
    order: 2,
    cards: 0,
  },
  {
    id: 'placeholder-3',
    title: 'Module 2',
    description: 'Core fundamentals',
    status: 'pending',
    order: 3,
    cards: 0,
  },
  {
    id: 'placeholder-4',
    title: 'Module 3',
    description: 'Advanced topics',
    status: 'pending',
    order: 4,
    cards: 0,
  },
];

const statusIcons = {
  completed: 'bi:check-circle-fill',
  in_progress: 'bi:clock-fill',
  pending: 'bi:circle',
};

const statusColors = {
  completed: 'text-green-500',
  in_progress: 'text-yellow-500',
  pending: 'text-muted-foreground',
};

/**
 * RoadmapContent Component
 *
 * Displays a learning roadmap with milestones and progress tracking.
 * Supports both real data and placeholder/empty states.
 *
 * @param props - Component props
 * @param props.roadmapData - Full roadmap data (optional)
 * @param props.milestones - Array of milestones (optional, overrides roadmapData.milestones)
 * @param props.isLoading - Loading state for async data fetching
 * @param props.onMilestoneClick - Callback when a milestone card is clicked
 * @param props.onGenerateRoadmap - Callback to trigger roadmap generation
 */
export function RoadmapContent({
  roadmapData,
  milestones: propMilestones,
  isLoading = false,
  onMilestoneClick,
  onGenerateRoadmap,
}: RoadmapContentProps = {}) {
  // Determine which milestones to display (priority: propMilestones > roadmapData.milestones > placeholder)
  const milestones =
    propMilestones || roadmapData?.milestones || DEFAULT_PLACEHOLDER_MILESTONES;

  // Determine if we have a real roadmap (not just placeholders)
  const hasRoadmap =
    !!propMilestones || (!!roadmapData && roadmapData.milestones.length > 0);

  // Calculate progress from milestones or roadmapData
  const totalCards =
    roadmapData?.totalCards || milestones.reduce((sum, m) => sum + m.cards, 0);
  const completedCards =
    roadmapData?.completedCards ||
    milestones
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + m.cards, 0);
  const progressPercentage =
    totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  // Determine if milestone cards should be clickable
  const isMilestoneClickable = !!onMilestoneClick;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">
            {roadmapData?.title || 'Learning Roadmap'}
          </h1>
        </div>

        {/* Generate Roadmap Button (if callback provided) */}
        {onGenerateRoadmap && !hasRoadmap && (
          <Button
            variant="ghost"
            className="border border-[#4a4a46] bg-[#30302e]"
            onClick={onGenerateRoadmap}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icon
                  icon="bi:arrow-repeat"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Generating...
              </>
            ) : (
              <>
                <Icon icon="bi:map" className="mr-2 h-4 w-4" />
                Generate Roadmap
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {progressPercentage}% Complete
            </span>
            <span className="text-muted-foreground">
              {completedCards} / {totalCards} cards
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Icon
              icon="bi:arrow-repeat"
              className="h-12 w-12 animate-spin text-primary"
            />
            <p className="mt-4 text-muted-foreground">Loading roadmap...</p>
          </CardContent>
        </Card>
      ) : hasRoadmap ? (
        /* Timeline */
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 h-full w-0.5 bg-border md:left-1/2" />

          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, index) => {
              const statusIcon = statusIcons[milestone.status];
              const statusColor = statusColors[milestone.status];

              return (
                <div
                  key={milestone.id}
                  className={`relative flex items-start gap-4 md:gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background">
                    <Icon
                      icon={statusIcon}
                      className={`h-6 w-6 ${statusColor}`}
                    />
                  </div>

                  {/* Content Card */}
                  <Card
                    className={`flex-1 md:max-w-md ${
                      isMilestoneClickable
                        ? 'cursor-pointer transition-all hover:border-primary hover:shadow-md'
                        : ''
                    }`}
                    onClick={() =>
                      isMilestoneClickable && onMilestoneClick(milestone)
                    }
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {milestone.title}
                      </CardTitle>
                      <CardDescription>{milestone.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Icon icon="bi:book" className="h-4 w-4" />
                          <span>{milestone.cards} cards</span>
                        </div>
                        {milestone.estimatedMinutes && (
                          <div className="flex items-center gap-2">
                            <Icon icon="bi:clock" className="h-4 w-4" />
                            <span>{milestone.estimatedMinutes} min</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="border border-[#4a4a46] bg-[#30302e]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-2 rounded-full p-4">
              <Icon icon="bi:map" className="h-12 w-12 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">No Roadmap Yet</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
              Upload your study materials to generate a personalized learning
              roadmap with AI
            </p>
            <Button
              asChild
              variant="ghost"
              className="w-48 items-center rounded-2xl text-[#191919]"
            >
              <Link href="/upload">
                <Icon icon="bi:upload" className="mr-2 h-4 w-4" />
                Upload Materials
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
