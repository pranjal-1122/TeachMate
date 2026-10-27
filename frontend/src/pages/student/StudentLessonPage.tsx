import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lessonsApi, PublishedLessonView } from '../../api/lessons';
import { progressApi } from '../../api/progress';
import { ScrollCardStack } from '../../components/scroll/ScrollCardStack';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const StudentLessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lessonView, setLessonView] = useState<PublishedLessonView | null>(null);
  const [completedCardIds, setCompletedCardIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  useEffect(() => {
    if (id) {
      loadLesson(id);
    }
  }, [id]);

  const loadLesson = async (lessonId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await lessonsApi.getLessonDetail(lessonId);
      setLessonView(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load micro-lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (cardId: string) => {
    if (!id) return;
    try {
      const res = await progressApi.recordProgress(id, cardId, true);
      setCompletedCardIds((prev) => new Set([...prev, cardId]));

      if (res.earned_badges && res.earned_badges.length > 0) {
        setEarnedBadges(res.earned_badges);
        setShowBadgeNotification(true);
      }
    } catch (err: any) {
      console.error('Failed to record card progress:', err);
    }
  };

  const handleTakeQuiz = () => {
    if (id) {
      navigate(`/student/lessons/${id}/quiz`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lessonView) {
    return (
      <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-12 max-w-2xl mx-auto space-y-4">
        <Alert type="error" title="Lesson Unavailable">
          {error || 'Lesson could not be loaded.'}
        </Alert>
        <Link to="/explore">
          <Button variant="secondary">← Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const { lesson, micro_lessons, quiz_available } = lessonView;

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center text-sm font-medium text-tm-forest-700/80 dark:text-tm-parchment/70 hover:text-tm-terracotta transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Explore Catalog
          </Link>

          {quiz_available && (
            <Button variant="primary" size="sm" onClick={handleTakeQuiz}>
              Take Quiz →
            </Button>
          )}
        </div>

        {/* Badge Notification Modal / Banner */}
        {showBadgeNotification && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎖️</span>
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  New Badge Unlocked!
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  You earned: {earnedBadges.join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBadgeNotification(false)}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Lesson Header */}
        <div className="bg-tm-forest-800/5 dark:bg-tm-parchment/5 rounded-xl p-6 border border-tm-forest-800/10 dark:border-tm-parchment/10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-tm-sage/20 text-tm-forest-800 dark:text-tm-sage">
              {lesson.subject}
            </span>
            <span className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/60 font-mono">
              {lesson.grade_level}
            </span>
            {lesson.readiness_override && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Teacher Readiness Override
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-tm-forest-900 dark:text-tm-parchment">
            {lesson.title}
          </h1>
          <p className="text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
            Topic: <span className="font-semibold text-tm-forest-900 dark:text-tm-parchment">{lesson.topic}</span>
          </p>

          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-tm-forest-700/70 dark:text-tm-parchment/60 mb-1">
                Learning Objectives
              </p>
              <ul className="list-disc list-inside text-xs text-tm-forest-800 dark:text-tm-parchment/80 space-y-0.5">
                {lesson.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Interactive Scrollable Stack of Micro-Cards */}
        <div className="pt-2">
          <ScrollCardStack
            cards={micro_lessons}
            completedCardIds={completedCardIds}
            onMarkComplete={handleMarkComplete}
            onTakeQuiz={handleTakeQuiz}
            quizAvailable={quiz_available}
          />
        </div>
      </div>
    </div>
  );
};
