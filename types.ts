
export enum Difficulty {
  JUNIOR = 'Junior',
  MID = 'Mid-level',
  SENIOR = 'Senior'
}

export enum UiLanguage {
  EN = 'en',
  AR = 'ar'
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface Language {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  icon: string;
  description: {
    en: string;
    ar: string;
  };
}

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface InterviewResponse {
  questionId: string;
  questionText: string;
  userAnswer: string;
  feedback: string;
  positives: string[];
  improvements: string[];
  score: number; // 0-100
}

export interface InterviewResult {
  date: string;
  language: string;
  difficulty: Difficulty;
  responses: InterviewResponse[];
  overallScore: number;
  jobDescription?: string;
}
