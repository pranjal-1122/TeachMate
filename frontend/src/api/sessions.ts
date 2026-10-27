import { apiRequest } from './client';

export interface Session {
  id: string;
  topic: string;
  subject: string;
  grade_level: string;
  duration_minutes: number;
  status: string;
  score?: number | null;
  revision_rounds_completed: number;
  readiness_override: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string; // "A", "B", "C", "D"
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  position: number;
  question: string;
  concept: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'conceptual' | 'application' | 'misconception';
  format?: 'mcq' | 'theoretical';
  options?: QuestionOption[] | null;
}

export interface AssessmentPayload {
  questions: AssessmentQuestion[];
  status: string;
}

export interface KnowledgeGap {
  concept: string;
  severity: string;
  explanation: string;
}

export interface PerQuestionFeedback {
  question_position: number;
  score: number;
  feedback: string;
  evidence: string;
}

export interface AnalysisDetail {
  score: number;
  strengths: string[];
  gaps: KnowledgeGap[];
  per_question_feedback: PerQuestionFeedback[];
  next_action: string;
}

export interface QuickCheckQuestion {
  id: string;
  prompt: string;
  concept: string;
}

export interface RevisionDetail {
  round: number;
  content: string;
  quick_check_questions: QuickCheckQuestion[];
  status: string;
}

export const sessionsApi = {
  list: () =>
    apiRequest<Session[]>('/sessions'),

  create: (payload: { topic: string; subject: string; grade_level: string; duration_minutes?: number }) =>
    apiRequest<{ session_id: string; status: string; topic: string; version: number }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  get: (sessionId: string) =>
    apiRequest<Session>(`/sessions/${sessionId}`),

  getAssessment: (sessionId: string) =>
    apiRequest<AssessmentPayload>(`/sessions/${sessionId}/assessment`),

  submitAnswers: (sessionId: string, payload: { answers: { question_id: string; text: string }[]; expected_version: number }) =>
    apiRequest<{ session_id: string; status: string; score: number; version: number }>(`/sessions/${sessionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAnalysis: (sessionId: string) =>
    apiRequest<AnalysisDetail>(`/sessions/${sessionId}/analysis`),

  getRevision: (sessionId: string) =>
    apiRequest<RevisionDetail>(`/sessions/${sessionId}/revision`),

  submitReassessment: (sessionId: string, payload: { answers: { question_id: string; text: string }[]; expected_version: number }) =>
    apiRequest<{ session_id: string; status: string; score: number; revision_rounds_completed: number; version: number }>(
      `/sessions/${sessionId}/reassessment`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  submitDecision: (
    sessionId: string,
    payload: { action: 'proceed_anyway' | 'continue_revision' | 'save_for_later'; acknowledge_incomplete_readiness: boolean; expected_version: number }
  ) =>
    apiRequest<{ session_id: string; status: string; readiness_override: boolean; version: number }>(
      `/sessions/${sessionId}/decision`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
};
