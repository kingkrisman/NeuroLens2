export type ReadingMode = 'default' | 'adhd' | 'dyslexia' | 'focus' | 'academic' | 'speed';

export interface ReadingProfile {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  bionicStrength: number;
  focusHighlight: boolean;
  rhythmOptimization: boolean;
  tintColor: string;
}

export const READING_PROFILES: Record<ReadingMode, ReadingProfile> = {
  default: {
    id: 'default',
    name: 'Standard',
    fontFamily: 'font-sans',
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0,
    wordSpacing: 0,
    bionicStrength: 0,
    focusHighlight: false,
    rhythmOptimization: false,
    tintColor: 'transparent',
  },
  adhd: {
    id: 'adhd',
    name: 'ADHD Mode',
    fontFamily: 'font-sans',
    fontSize: 20,
    lineHeight: 1.8,
    letterSpacing: 0.02,
    wordSpacing: 0.05,
    bionicStrength: 0.6,
    focusHighlight: true,
    rhythmOptimization: true,
    tintColor: '#fef3c7', // Warm amber tint
  },
  dyslexia: {
    id: 'dyslexia',
    name: 'Dyslexia Mode',
    fontFamily: 'font-serif',
    fontSize: 20,
    lineHeight: 2,
    letterSpacing: 0.05,
    wordSpacing: 0.1,
    bionicStrength: 0.4,
    focusHighlight: true,
    rhythmOptimization: false,
    tintColor: '#f0fdf4', // Soft mint tint
  },
  focus: {
    id: 'focus',
    name: 'Deep Focus',
    fontFamily: 'font-sans',
    fontSize: 22,
    lineHeight: 1.7,
    letterSpacing: 0,
    wordSpacing: 0,
    bionicStrength: 0,
    focusHighlight: true,
    rhythmOptimization: true,
    tintColor: '#f8fafc', // Clean slate tint
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    fontFamily: 'font-serif',
    fontSize: 18,
    lineHeight: 1.6,
    letterSpacing: 0,
    wordSpacing: 0,
    bionicStrength: 0.3,
    focusHighlight: false,
    rhythmOptimization: false,
    tintColor: '#fff',
  },
  speed: {
    id: 'speed',
    name: 'Speed Reading',
    fontFamily: 'font-sans',
    fontSize: 18,
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    bionicStrength: 0.8,
    focusHighlight: true,
    rhythmOptimization: true,
    tintColor: 'transparent',
  }
};
