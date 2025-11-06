export enum ModuleType {
  Learn = 'Learn',
  Quiz = 'Quiz',
  Test = 'Test',
  MatchingGame = 'Matching Game',
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MatchingPair {
  term: string;
  definition: string;
}

export interface Module {
  title: string;
  type: ModuleType;
  // For Learn modules
  summary?: string;
  keyPoints?: string[];
  imagePrompt?: string;
  // For Quiz/Test modules
  questions?: PracticeQuestion[];
  // For MatchingGame modules
  pairs?: MatchingPair[];
  instructions?: string;
}
