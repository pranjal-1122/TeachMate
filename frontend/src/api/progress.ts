import { apiRequest } from './client';

export interface CardProgressResponse {
  completed_cards: number;
  total_cards: number;
  progress_percent: number;
  streak: number;
  earned_badges: string[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  last_active_date?: string | null;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_threshold: number;
  earned: boolean;
  earned_at?: string | null;
}

export interface CourseProgressItem {
  lesson_id: string;
  title: string;
  subject: string;
  grade_level: string;
  completed_cards: number;
  total_cards: number;
  progress_percent: number;
  last_completed_at?: string | null;
}

export interface StudentProgressOverview {
  courses: CourseProgressItem[];
  streak: StreakInfo;
  badges: BadgeItem[];
  total_lessons_completed: number;
  total_quizzes_attempted: number;
}

export const progressApi = {
  recordProgress: (lessonId: string, cardId: string, completed = true) =>
    apiRequest<CardProgressResponse>(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId, completed }),
    }),

  getProgressOverview: () =>
    apiRequest<StudentProgressOverview>('/me/progress'),

  getBadges: () =>
    apiRequest<BadgeItem[]>('/me/badges'),
};
