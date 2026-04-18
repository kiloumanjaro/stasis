import type {
  UserPreferences,
  AdaptiveStudyParameters,
  MetricScore,
} from '@/types/preferences';
import { COLOR_THEMES } from '@/types/preferences';

/**
 * Calculate adaptive study parameters based on user preferences
 * Based on validated psychological research
 */
export function calculateAdaptiveParameters(
  prefs: UserPreferences
): AdaptiveStudyParameters {
  // 1. Calculate normalized scores for each metric category
  const attentionScore = calculateAttentionScore(prefs.attentionControl);
  const adhdScore = calculateADHDScore(prefs.adhdIndicators);
  const stressScore = calculateStressScore(prefs.stressAndAnxiety);
  const workingMemoryScore = calculateWorkingMemoryScore(prefs.workingMemory);
  const processingSpeedScore = calculateProcessingSpeedScore(
    prefs.processingSpeed
  );
  const gritScore = calculateGritScore(prefs.gritAndPersistence);
  const motivationScore = calculateMotivationScore(
    prefs.motivationAndRegulation
  );

  // 2. Session Duration (15-50 minutes)
  // Inversely proportional to ADHD indicators, directly proportional to attention control
  const sessionDuration = Math.round(
    15 + (attentionScore / 100) * 25 - (adhdScore / 100) * 10
  );

  // 3. Break Frequency (15-50 minutes)
  // Based on attention scores and ADHD indicators
  const breakFrequency = Math.round(
    15 + (attentionScore / 100) * 30 - (adhdScore / 100) * 5
  );

  // 4. Break Duration (3-15 minutes)
  // Based on stress levels and ADHD (higher = need longer breaks)
  const breakDuration = Math.round(
    3 + (stressScore / 100) * 8 + (adhdScore / 100) * 4
  );

  // 5. Difficulty Progression
  let difficultyProgression: 'gradual' | 'moderate' | 'immediate' = 'moderate';
  if (gritScore >= 70 && stressScore < 40) {
    difficultyProgression = 'immediate';
  } else if (gritScore < 40 || stressScore >= 70) {
    difficultyProgression = 'gradual';
  }

  // 6. Repetition Frequency
  // Based on working memory capacity
  let repetitionFrequency: 'high' | 'moderate' | 'low' = 'moderate';
  if (workingMemoryScore < 40) repetitionFrequency = 'high';
  else if (workingMemoryScore >= 70) repetitionFrequency = 'low';

  // 7. Content Density
  // Based on processing speed
  let contentDensity: 'sparse' | 'moderate' | 'dense' = 'moderate';
  if (processingSpeedScore < 40) contentDensity = 'sparse';
  else if (processingSpeedScore >= 70) contentDensity = 'dense';

  // 8. Feedback Frequency
  // Based on motivation type and grit
  let feedbackFrequency: 'constant' | 'frequent' | 'moderate' | 'minimal' =
    'moderate';
  if (motivationScore < 40 || gritScore < 40) feedbackFrequency = 'constant';
  else if (motivationScore < 60) feedbackFrequency = 'frequent';
  else if (motivationScore >= 80) feedbackFrequency = 'minimal';

  // 9. Theme Selection
  const theme = calculateTheme(
    attentionScore,
    adhdScore,
    stressScore,
    motivationScore
  );

  return {
    sessionDuration: Math.max(15, Math.min(50, sessionDuration)),
    breakFrequency: Math.max(15, Math.min(50, breakFrequency)),
    breakDuration: Math.max(3, Math.min(15, breakDuration)),
    difficultyProgression,
    repetitionFrequency,
    contentDensity,
    feedbackFrequency,
    theme,
  };
}

/**
 * Calculate theme based on psychological profile
 * Uses research-backed color psychology
 */
function calculateTheme(
  attentionScore: number,
  adhdScore: number,
  stressScore: number,
  motivationScore: number
): AdaptiveStudyParameters['theme'] {
  // High ADHD indicators (>60) → Orange/Warm colors
  if (adhdScore >= 60) {
    const intensity = Math.min(100, adhdScore + 20);
    return {
      ...COLOR_THEMES.adhdFriendly,
      intensity,
    };
  }

  // High stress (>70) → Calming blue
  if (stressScore >= 70) {
    const intensity = 100 - stressScore; // Less intense for high stress
    return {
      ...COLOR_THEMES.lowStress,
      intensity,
    };
  }

  // Low motivation (<40) → Motivational colors
  if (motivationScore < 40) {
    const intensity = 100 - motivationScore; // More intense for lower motivation
    return {
      ...COLOR_THEMES.motivational,
      intensity,
    };
  }

  // High attention (>70) → Focused blue
  if (attentionScore >= 70) {
    const intensity = Math.min(100, attentionScore);
    return {
      ...COLOR_THEMES.highFocus,
      intensity,
    };
  }

  // Balanced → Green
  const intensity =
    (attentionScore + (100 - stressScore) + motivationScore) / 3;
  return {
    ...COLOR_THEMES.balanced,
    intensity,
  };
}

/**
 * Calculate normalized attention control score (0-100)
 */
function calculateAttentionScore(
  attention: UserPreferences['attentionControl']
): number {
  const avg =
    (attention.focusDespiteDistractions +
      attention.concentrationDuration +
      (100 - attention.mindWandering) + // Reverse scored
      (100 - attention.taskSwitchingDifficulty)) / // Reverse scored
    4;
  return Math.round(avg);
}

/**
 * Calculate ADHD indicator score (0-100)
 * Higher = more ADHD characteristics
 */
function calculateADHDScore(adhd: UserPreferences['adhdIndicators']): number {
  // Convert 1-5 scale to 0-100
  const avg =
    ((adhd.sustainedAttentionDifficulty - 1) * 25 +
      (adhd.distractibility - 1) * 25 +
      (adhd.restlessnessOrFidgeting - 1) * 25 +
      (adhd.impulsivity - 1) * 25) /
    4;
  return Math.round(avg);
}

/**
 * Calculate stress/anxiety score (0-100)
 */
function calculateStressScore(
  stress: UserPreferences['stressAndAnxiety']
): number {
  const avg =
    (stress.anxietyFrequency +
      (100 - stress.worryControl) + // Reverse scored
      stress.physicalTension +
      stress.overwhelmFeeling) /
    4;
  return Math.round(avg);
}

/**
 * Calculate working memory score (0-100)
 */
function calculateWorkingMemoryScore(
  memory: UserPreferences['workingMemory']
): number {
  const avg =
    (memory.multiStepInstructions +
      memory.mentalCalculation +
      memory.simultaneousConcepts +
      memory.rereadingFrequency) /
    4;
  return Math.round(avg);
}

/**
 * Calculate processing speed score (0-100)
 */
function calculateProcessingSpeedScore(
  speed: UserPreferences['processingSpeed']
): number {
  const avg =
    (speed.conceptUnderstanding +
      speed.readingSpeed +
      speed.noteTakingPace +
      speed.timePressureComfort) /
    4;
  return Math.round(avg);
}

/**
 * Calculate grit/persistence score (0-100)
 */
function calculateGritScore(
  grit: UserPreferences['gritAndPersistence']
): number {
  const avg =
    (grit.taskCompletion +
      grit.longTermGoalConsistency +
      grit.setbackRecovery +
      grit.challengePreference) /
    4;
  return Math.round(avg);
}

/**
 * Calculate motivation score (0-100)
 * Higher = more intrinsic motivation
 */
function calculateMotivationScore(
  motivation: UserPreferences['motivationAndRegulation']
): number {
  const avg =
    (motivation.intrinsicInterest +
      (100 - motivation.externalRewardNeed) + // Reverse scored
      motivation.selfScheduling +
      motivation.processEnjoyment) /
    4;
  return Math.round(avg);
}

/**
 * Get all metric scores with recommendations
 */
export function getMetricScores(prefs: UserPreferences): MetricScore[] {
  const attentionScore = calculateAttentionScore(prefs.attentionControl);
  const adhdScore = calculateADHDScore(prefs.adhdIndicators);
  const stressScore = calculateStressScore(prefs.stressAndAnxiety);
  const workingMemoryScore = calculateWorkingMemoryScore(prefs.workingMemory);
  const processingSpeedScore = calculateProcessingSpeedScore(
    prefs.processingSpeed
  );
  const gritScore = calculateGritScore(prefs.gritAndPersistence);
  const motivationScore = calculateMotivationScore(
    prefs.motivationAndRegulation
  );

  return [
    {
      category: 'Attention Control',
      score: attentionScore,
      level:
        attentionScore >= 70
          ? 'high'
          : attentionScore >= 40
            ? 'moderate'
            : 'low',
      recommendations: getAttentionRecommendations(attentionScore),
    },
    {
      category: 'ADHD Indicators',
      score: adhdScore,
      level: adhdScore >= 60 ? 'high' : adhdScore >= 30 ? 'moderate' : 'low',
      recommendations: getADHDRecommendations(adhdScore),
    },
    {
      category: 'Stress & Anxiety',
      score: stressScore,
      level:
        stressScore >= 70 ? 'high' : stressScore >= 40 ? 'moderate' : 'low',
      recommendations: getStressRecommendations(stressScore),
    },
    {
      category: 'Working Memory',
      score: workingMemoryScore,
      level:
        workingMemoryScore >= 70
          ? 'high'
          : workingMemoryScore >= 40
            ? 'moderate'
            : 'low',
      recommendations: getMemoryRecommendations(workingMemoryScore),
    },
    {
      category: 'Processing Speed',
      score: processingSpeedScore,
      level:
        processingSpeedScore >= 70
          ? 'high'
          : processingSpeedScore >= 40
            ? 'moderate'
            : 'low',
      recommendations: getProcessingRecommendations(processingSpeedScore),
    },
    {
      category: 'Grit & Persistence',
      score: gritScore,
      level: gritScore >= 70 ? 'high' : gritScore >= 40 ? 'moderate' : 'low',
      recommendations: getGritRecommendations(gritScore),
    },
    {
      category: 'Intrinsic Motivation',
      score: motivationScore,
      level:
        motivationScore >= 70
          ? 'high'
          : motivationScore >= 40
            ? 'moderate'
            : 'low',
      recommendations: getMotivationRecommendations(motivationScore),
    },
  ];
}

// Recommendation generators
function getAttentionRecommendations(score: number): string[] {
  if (score >= 70)
    return [
      'Longer study sessions (45-50 min) will be effective',
      'You can handle complex, sustained focus tasks',
      'Cool blue theme enhances your natural focus ability',
    ];
  if (score >= 40)
    return [
      'Standard Pomodoro (25-30 min) sessions recommended',
      'Regular breaks help maintain your attention',
      'Balanced green theme supports consistent focus',
    ];
  return [
    'Shorter sessions (15-20 min) with frequent breaks',
    'Use timers and reminders to stay on track',
    'Energizing orange theme helps combat distraction',
    'Consider movement breaks to reset attention',
  ];
}

function getADHDRecommendations(score: number): string[] {
  if (score >= 60)
    return [
      'Micro-sessions (15 min) with active breaks recommended',
      'Gamification and rewards will enhance engagement',
      'Orange/warm theme reduces restlessness',
      'Movement breaks (not passive) are essential',
      'Multi-sensory learning materials recommended',
    ];
  if (score >= 30)
    return [
      'Shorter sessions (20-25 min) with structured breaks',
      'Some gamification elements will help',
      'Warm yellow theme balances attention needs',
    ];
  return [
    'Standard session lengths are suitable',
    'Traditional study pacing will work well',
    'Minimal accommodations needed',
  ];
}

function getStressRecommendations(score: number): string[] {
  if (score >= 70)
    return [
      'Start with easier materials to build confidence',
      'Very frequent breaks with breathing exercises',
      'Calming blue theme reduces anxiety',
      'Progressive difficulty increase recommended',
      'Clear milestones help manage overwhelm',
    ];
  if (score >= 40)
    return [
      'Balanced difficulty with structured breaks',
      'Green theme provides calming balance',
      'Regular check-ins help prevent stress buildup',
    ];
  return [
    'You can handle challenging materials',
    'Minimal stress accommodations needed',
    'Energizing colors are acceptable',
  ];
}

function getMemoryRecommendations(score: number): string[] {
  if (score >= 70)
    return [
      'Complex materials and longer explanations are suitable',
      'Minimal repetition needed',
      'Can handle multiple concepts simultaneously',
    ];
  if (score >= 40)
    return [
      'Chunk information into manageable pieces',
      'Moderate repetition helps retention',
      'Visual aids enhance understanding',
    ];
  return [
    'Small information chunks are essential',
    'High repetition frequency recommended',
    'Multi-modal presentation (visual + audio)',
    'Frequent summarization helps consolidation',
  ];
}

function getProcessingRecommendations(score: number): string[] {
  if (score >= 70)
    return [
      'Dense materials and faster pacing are suitable',
      'Challenge-focused content will engage you',
      'Dynamic theme variations are acceptable',
    ];
  if (score >= 40)
    return [
      'Standard pacing with balanced review time',
      'Moderate content density is optimal',
      'Consistent theme supports processing',
    ];
  return [
    'Extended time per concept recommended',
    'Reduced material density essential',
    'Avoid time pressure situations',
    'Calm, consistent theme reduces cognitive load',
    'Frequent pauses aid comprehension',
  ];
}

function getGritRecommendations(score: number): string[] {
  if (score >= 70)
    return [
      'Challenging materials upfront will engage you',
      'Longer sessions with stretch goals recommended',
      'Achievement colors (gold, strong green) motivate',
    ];
  if (score >= 40)
    return [
      'Progressive difficulty maintains engagement',
      'Balanced challenge with regular feedback',
      'Motivational colors support persistence',
    ];
  return [
    'Quick wins early build momentum',
    'Frequent positive feedback essential',
    'Micro-goals prevent overwhelm',
    'Gamification and reward systems recommended',
    'Encouraging warm colors (coral, yellow) boost confidence',
  ];
}

function getMotivationRecommendations(score: number): string[] {
  if (score >= 70)
    return [
      'Flexible scheduling suits your intrinsic drive',
      'Discovery-based learning will engage you',
      'Minimal external prompts needed',
      'Blue/green themes sustain internal focus',
    ];
  if (score >= 40)
    return [
      'Structured schedule with some flexibility',
      'Periodic reminders help maintain momentum',
      'Mixed motivational palette works well',
    ];
  return [
    'Strict scheduling with frequent checkpoints',
    'External accountability systems essential',
    'Reward systems and deadline pressure help',
    'Motivating warm colors (orange, red accents)',
    'Visual progress bars boost engagement',
  ];
}
