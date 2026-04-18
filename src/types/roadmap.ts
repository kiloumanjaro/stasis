/**
 * Roadmap Type Definitions
 *
 * Type definitions for the dynamic roadmap feature that visualizes
 * learning paths with milestones and associated flashcards.
 */

/**
 * Status of a milestone in the learning roadmap
 */
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Individual milestone in a learning roadmap
 */
export interface Milestone {
  /** Unique identifier for the milestone */
  id: string;

  /** Title of the milestone (e.g., "Introduction to Variables") */
  title: string;

  /** Detailed description of what will be learned */
  description: string;

  /** Current status of the milestone */
  status: MilestoneStatus;

  /** Order/position in the roadmap sequence */
  order: number;

  /** Number of flashcards associated with this milestone */
  cards: number;

  /** Estimated time to complete in minutes (optional) */
  estimatedMinutes?: number;
}

/**
 * Complete roadmap data structure
 */
export interface RoadmapData {
  /** Unique identifier for the roadmap */
  id: string;

  /** User ID who owns this roadmap */
  userId: string;

  /** ID of the uploaded document this roadmap is based on */
  documentId: string;

  /** Title of the roadmap (e.g., "Python Programming Fundamentals") */
  title: string;

  /** Optional description of the learning path */
  description?: string;

  /** Array of milestones in order */
  milestones: Milestone[];

  /** Total number of flashcards across all milestones */
  totalCards: number;

  /** Number of cards marked as completed/reviewed */
  completedCards: number;

  /** Overall progress percentage (0-100) */
  progressPercentage: number;

  /** When the roadmap was created */
  createdAt: Date;

  /** When the roadmap was last updated */
  updatedAt: Date;
}

/**
 * Props for the RoadmapContent component
 *
 * Designed to accept either real data or fall back to placeholder/empty state
 */
export interface RoadmapContentProps {
  /** Full roadmap data (optional - uses empty state if not provided) */
  roadmapData?: RoadmapData;

  /** Array of milestones (optional - can be provided without full roadmapData) */
  milestones?: Milestone[];

  /** Loading state for async data fetching */
  isLoading?: boolean;

  /** Callback when a milestone card is clicked */
  onMilestoneClick?: (milestone: Milestone) => void;

  /** Callback to trigger roadmap generation from a document */
  onGenerateRoadmap?: () => void;
}

/**
 * Input data for LLM roadmap generation
 *
 * Sent to Gemini API to generate a structured learning roadmap
 */
export interface LLMRoadmapPrompt {
  /** Text content extracted from the uploaded document */
  documentContent: string;

  /** Type of document (pdf, txt, image) for context */
  documentType: 'pdf' | 'txt' | 'image';

  /** Optional user preferences for customization */
  userPreferences?: {
    /** Target difficulty level (beginner, intermediate, advanced) */
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';

    /** Number of milestones to generate */
    milestoneCount?: number;

    /** Average time per milestone in minutes */
    timePerMilestone?: number;
  };
}

/**
 * Expected response structure from LLM
 *
 * Gemini returns this JSON structure for roadmap generation
 */
export interface LLMRoadmapResponse {
  /** Generated title for the roadmap */
  title: string;

  /** Brief description of the learning path */
  description: string;

  /** Array of generated milestones */
  milestones: Array<{
    /** Milestone title */
    title: string;

    /** Milestone description */
    description: string;

    /** Suggested topics/keywords to generate flashcards from */
    topics: string[];

    /** Estimated time to complete in minutes */
    estimatedMinutes?: number;
  }>;
}

/**
 * Update data for milestone progress
 */
export interface MilestoneUpdate {
  /** New status to set */
  status?: MilestoneStatus;

  /** Updated card count */
  cards?: number;

  /** Mark specific cards as completed */
  completedCards?: number;
}
