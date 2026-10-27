import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi, BadgeItem } from '../../api/progress';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

export const StudentBadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressApi.getBadges();
      setBadges(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-tm-forest-800/10 dark:border-tm-parchment/10 pb-6">
          <div>
            <Link
              to="/student/progress"
              className="inline-flex items-center text-xs font-semibold text-tm-forest-700/80 dark:text-tm-parchment/70 hover:text-tm-terracotta mb-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Progress
            </Link>
            <h1 className="text-3xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment tracking-tight">
              Achievement Badges
            </h1>
            <p className="mt-1 text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
              Celebrate your learning milestones. Badges are verified directly on the backend upon lesson completion and quiz mastery.
            </p>
          </div>

          <div className="px-4 py-2 bg-tm-forest-800/5 dark:bg-tm-parchment/10 rounded-lg border border-tm-forest-800/10 dark:border-tm-parchment/10 text-center sm:text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
              Unlocked
            </span>
            <p className="text-xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
              {earnedCount} / {badges.length}
            </p>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Error Loading Badges">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {badges.map((badge) => (
              <Card
                key={badge.id}
                className={`p-6 flex items-start space-x-5 transition-all ${
                  badge.earned
                    ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-sm'
                    : 'opacity-70 grayscale'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                    badge.earned
                      ? 'bg-emerald-500/15 border border-emerald-500/30'
                      : 'bg-tm-forest-800/10 dark:bg-tm-parchment/10 border border-tm-forest-800/10'
                  }`}
                >
                  {badge.icon || '🎖️'}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                      {badge.name}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        badge.earned
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-tm-forest-800/10 text-tm-forest-800/70 dark:bg-tm-parchment/10 dark:text-tm-parchment/60'
                      }`}
                    >
                      {badge.earned ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>

                  <p className="text-xs text-tm-forest-700/80 dark:text-tm-parchment/70 leading-relaxed">
                    {badge.description}
                  </p>

                  <div className="pt-2 text-[11px] text-tm-forest-700/60 dark:text-tm-parchment/50 border-t border-tm-forest-800/10 dark:border-tm-parchment/10 flex items-center justify-between">
                    <span>
                      Criteria: {badge.criteria_threshold} {badge.criteria_type.replace('_', ' ')}
                    </span>
                    {badge.earned_at && (
                      <span>Earned: {new Date(badge.earned_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center pt-8">
          <Link to="/explore">
            <Button variant="primary">Start Earning More Badges →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
