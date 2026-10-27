import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi, StudentProgressOverview } from '../../api/progress';
import { Card } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const StudentProgressPage: React.FC = () => {
  const [overview, setOverview] = useState<StudentProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressApi.getProgressOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-tm-forest-800/10 dark:border-tm-parchment/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment tracking-tight">
              Learning Progress & Streaks
            </h1>
            <p className="mt-1 text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
              Track your daily learning consistency, review active courses, and celebrate milestone badges.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="primary">Browse Lessons</Button>
          </Link>
        </div>

        {error && (
          <Alert type="error" title="Error Loading Progress">
            {error}
          </Alert>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Streak */}
          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Daily Streak
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {overview?.streak.current || 0} {overview?.streak.current === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/50">
                Best: {overview?.streak.longest || 0} days
              </p>
            </div>
          </Card>

          {/* Lessons Completed */}
          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Completed Lessons
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {overview?.total_lessons_completed || 0}
              </p>
              <p className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/50">
                100% cards reviewed
              </p>
            </div>
          </Card>

          {/* Quizzes Attempted */}
          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-tm-terracotta/15 rounded-xl text-tm-terracotta">
              <span className="text-2xl">✍️</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Quizzes Attempted
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {overview?.total_quizzes_attempted || 0}
              </p>
              <p className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/50">
                Knowledge validations
              </p>
            </div>
          </Card>

          {/* Badges Earned */}
          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-purple-500/15 rounded-xl text-purple-600 dark:text-purple-400">
              <span className="text-2xl">🎖️</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Badges Earned
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {overview?.badges.filter((b) => b.earned).length || 0} / {overview?.badges.length || 4}
              </p>
              <Link
                to="/student/badges"
                className="text-xs text-tm-terracotta hover:underline font-semibold"
              >
                View collection →
              </Link>
            </div>
          </Card>
        </div>

        {/* Enrolled / In-Progress Courses */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
            Course Completion Trackers
          </h2>

          {!overview?.courses || overview.courses.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-tm-forest-800/5 dark:bg-tm-parchment/10 rounded-full flex items-center justify-center text-tm-forest-800 dark:text-tm-parchment">
                <span className="text-xl">📖</span>
              </div>
              <h3 className="text-base font-semibold text-tm-forest-900 dark:text-tm-parchment">
                No active courses yet
              </h3>
              <p className="text-xs text-tm-forest-700/80 dark:text-tm-parchment/70 max-w-sm mx-auto">
                Start reading micro-lesson cards from the catalog to track your progress and build streaks.
              </p>
              <Link to="/explore">
                <Button variant="secondary" size="sm">Explore Catalog</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.courses.map((course) => (
                <Card key={course.lesson_id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-tm-sage/20 text-tm-forest-800 dark:text-tm-sage">
                        {course.subject}
                      </span>
                      <h3 className="text-base font-display font-semibold text-tm-forest-900 dark:text-tm-parchment mt-1">
                        {course.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-tm-terracotta">
                      {course.progress_percent}%
                    </span>
                  </div>

                  <ProgressBar value={course.progress_percent} />

                  <div className="flex items-center justify-between text-xs text-tm-forest-700/70 dark:text-tm-parchment/60 pt-1">
                    <span>
                      {course.completed_cards} of {course.total_cards} cards completed
                    </span>
                    <Link
                      to={`/student/lessons/${course.lesson_id}`}
                      className="text-tm-terracotta hover:underline font-semibold"
                    >
                      Continue →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Badges Preview Carousel / Grid */}
        <div className="space-y-4 pt-4 border-t border-tm-forest-800/10 dark:border-tm-parchment/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
              Milestone Badges
            </h2>
            <Link
              to="/student/badges"
              className="text-xs font-semibold text-tm-terracotta hover:underline"
            >
              See all criteria →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {overview?.badges.map((badge) => (
              <Card
                key={badge.id}
                className={`p-4 text-center space-y-2 transition-all ${
                  badge.earned
                    ? 'border-emerald-500/40 bg-emerald-50/15 dark:bg-emerald-950/20'
                    : 'opacity-60 grayscale'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-tm-forest-800/5 dark:bg-tm-parchment/10 flex items-center justify-center text-2xl">
                  {badge.icon || '🎖️'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-tm-forest-900 dark:text-tm-parchment">
                    {badge.name}
                  </h4>
                  <p className="text-[11px] text-tm-forest-700/70 dark:text-tm-parchment/60 line-clamp-2 mt-0.5">
                    {badge.description}
                  </p>
                </div>
                <div className="pt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      badge.earned
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-tm-forest-800/10 text-tm-forest-800 dark:bg-tm-parchment/10 dark:text-tm-parchment/70'
                    }`}
                  >
                    {badge.earned ? 'Earned' : 'Locked'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
