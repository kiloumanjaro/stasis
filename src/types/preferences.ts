// User Preference Types based on validated psychological metrics

export interface UserPreferences {
  // 1. Attention Control & Sustained Focus (0-100)
  attentionControl: {
    focusDespiteDistractions: number; // 0=always distracted, 100=never distracted
    concentrationDuration: number; // 0=very short, 100=very long
    mindWandering: number; // 0=constantly, 100=rarely (reverse scored in display)
    taskSwitchingDifficulty: number; // 0=very easy, 100=very difficult
  };

  // 2. ADHD-Related Indicators (1-5 scale per ASRS)
  adhdIndicators: {
    sustainedAttentionDifficulty: number; // 1=never, 5=very often
    distractibility: number; // 1=never, 5=very often
    restlessnessOrFidgeting: number; // 1=never, 5=very often
    impulsivity: number; // 1=never, 5=very often
  };

  // 3. Stress Tolerance & Anxiety (0-100)
  stressAndAnxiety: {
    anxietyFrequency: number; // 0=never anxious, 100=constantly anxious
    worryControl: number; // 0=can't stop worrying, 100=easily stop worrying
    physicalTension: number; // 0=no tension, 100=constant tension
    overwhelmFeeling: number; // 0=never overwhelmed, 100=always overwhelmed
  };

  // 4. Working Memory Capacity (0-100)
  workingMemory: {
    multiStepInstructions: number; // 0=can't remember, 100=easily remember
    mentalCalculation: number; // 0=very difficult, 100=very easy
    simultaneousConcepts: number; // 0=can't hold multiple, 100=easily hold many
    rereadingFrequency: number; // 0=always need to reread, 100=rarely reread
  };

  // 5. Information Processing Speed (0-100)
  processingSpeed: {
    conceptUnderstanding: number; // 0=very slow, 100=very fast
    readingSpeed: number; // 0=very slow, 100=very fast
    noteTakingPace: number; // 0=struggle to keep up, 100=easily keep up
    timePressureComfort: number; // 0=very uncomfortable, 100=thrive under pressure
  };

  // 6. Academic Grit & Persistence (0-100)
  gritAndPersistence: {
    taskCompletion: number; // 0=give up easily, 100=always complete
    longTermGoalConsistency: number; // 0=inconsistent, 100=very consistent
    setbackRecovery: number; // 0=slow recovery, 100=quick recovery
    challengePreference: number; // 0=prefer easy, 100=prefer difficult
  };

  // 7. Motivation & Self-Regulation (0-100)
  motivationAndRegulation: {
    intrinsicInterest: number; // 0=no interest, 100=love learning
    externalRewardNeed: number; // 0=don't need rewards, 100=need constant rewards
    selfScheduling: number; // 0=need supervision, 100=self-directed
    processEnjoyment: number; // 0=only care about results, 100=enjoy the process
  };
}

export interface AdaptiveStudyParameters {
  sessionDuration: number; // minutes (15-50)
  breakFrequency: number; // minutes between breaks (15-50)
  breakDuration: number; // minutes (3-15)
  difficultyProgression: 'gradual' | 'moderate' | 'immediate';
  repetitionFrequency: 'high' | 'moderate' | 'low';
  contentDensity: 'sparse' | 'moderate' | 'dense';
  feedbackFrequency: 'constant' | 'frequent' | 'moderate' | 'minimal';
  theme: {
    primary: string; // hex color
    intensity: number; // 0-100
    name: string; // e.g., "Focused Blue", "ADHD-Friendly Orange"
  };
}

export interface MetricScore {
  category: string;
  score: number; // 0-100 normalized
  level: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

// Color mappings based on research
export const COLOR_THEMES = {
  highFocus: {
    primary: '#4A90E2', // Cool blue - promotes mental clarity
    name: 'Focused Blue',
    description: 'Optimal for sustained concentration',
  },
  balanced: {
    primary: '#7ED321', // Light green - calming and balancing
    name: 'Balanced Green',
    description: 'Harmonious learning environment',
  },
  energizing: {
    primary: '#F5A623', // Warm orange - gentle energy
    name: 'Energizing Orange',
    description: 'Stimulates attention without stress',
  },
  adhdFriendly: {
    primary: '#FF8C42', // Soft orange - activating
    name: 'ADHD-Optimized',
    description: 'Reduces restlessness, enhances focus',
  },
  lowStress: {
    primary: '#89CFF0', // Soft blue - reduces anxiety
    name: 'Calm Blue',
    description: 'Lowers stress and sharpens focus',
  },
  motivational: {
    primary: '#FF6B6B', // Coral - encouraging
    name: 'Motivational Coral',
    description: 'Provides energy and encouragement',
  },
};
