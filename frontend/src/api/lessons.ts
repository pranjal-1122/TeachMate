import { apiRequest } from './client';

export interface LessonSection {
  heading: string;
  content: string;
}

export interface VisualSpec {
  type: string;
  title: string;
  spec: string;
}

export interface ClassroomActivity {
  title: string;
  duration_minutes: number;
  instructions: string;
}

export interface LessonDetail {
  id: string;
  session_id?: string;
  teacher_id: string;
  title: string;
  topic: string;
  subject: string;
  grade_level: string;
  duration_minutes: number;
  objectives: string[];
  sections: LessonSection[];
  visual_specs: VisualSpec[];
  activities: ClassroomActivity[];
  summary: string;
  visibility: 'draft' | 'published';
  readiness_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface MicroLessonCard {
  id: string;
  position: number;
  card_type: 'concept' | 'example' | 'diagram' | 'micro_quiz' | 'reflection' | 'video';
  title: string;
  content_markdown: string;
  media_spec?: Record<string, any>;
  estimated_read_time_seconds: number;
}

export interface PublishedLessonView {
  lesson: LessonDetail;
  micro_lessons: MicroLessonCard[];
  quiz_available: boolean;
  is_teacher_owner: boolean;
}

export interface LessonCatalogItem {
  id: string;
  title: string;
  topic: string;
  subject: string;
  grade_level: string;
  duration_minutes: number;
  readiness_override: boolean;
  teacher_name: string;
  card_count: number;
  created_at: string;
}

export interface LessonCatalogResponse {
  items: LessonCatalogItem[];
  next_cursor?: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface PublicQuizQuestion {
  id: string;
  position: number;
  question_text: string;
  options: QuizOption[];
}

export interface PublicQuizPayload {
  quiz_id: string;
  title: string;
  questions: PublicQuizQuestion[];
}

export interface QuestionFeedbackItem {
  question_id: string;
  correct: boolean;
  selected_option_id: string;
  correct_option_id: string;
  explanation: string;
}

export interface QuizAttemptResult {
  score: number;
  correct_count: number;
  total: number;
  feedback: QuestionFeedbackItem[];
  earned_badges: string[];
}

export const lessonsApi = {
  getSessionLesson: (sessionId: string) =>
    apiRequest<{ lesson: LessonDetail; readiness_override: boolean }>(`/sessions/${sessionId}/lesson`),

  updateLesson: (sessionId: string, payload: { title?: string; objectives?: string[]; sections?: LessonSection[]; summary?: string; expected_version: number }) =>
    apiRequest<LessonDetail>(`/sessions/${sessionId}/lesson`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  publishLesson: (sessionId: string, expectedVersion: number) =>
    apiRequest<{ lesson_id: string; visibility: string; version: number }>(`/sessions/${sessionId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ expected_version: expectedVersion }),
    }),

  listCatalog: (params?: { subject?: string; grade_level?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.append('subject', params.subject);
    if (params?.grade_level) query.append('grade_level', params.grade_level);
    if (params?.q) query.append('q', params.q);
    const qs = query.toString();
    return apiRequest<LessonCatalogResponse>(`/lessons${qs ? `?${qs}` : ''}`);
  },

  getLessonDetail: (lessonId: string) =>
    apiRequest<PublishedLessonView>(`/lessons/${lessonId}`),

  getQuiz: (lessonId: string) =>
    apiRequest<PublicQuizPayload>(`/lessons/${lessonId}/quiz`),

  submitQuizAttempt: (quizId: string, payload: { answers: { question_id: string; selected_option_id: string }[] }) =>
    apiRequest<QuizAttemptResult>(`/quizzes/${quizId}/attempts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
