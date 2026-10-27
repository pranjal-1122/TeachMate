import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sessionsApi, Session } from '../../api/sessions';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionsApi.list();
      setSessions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load teaching sessions');
    } finally {
      setLoading(false);
    }
  };

  const getResumeUrl = (session: Session) => {
    switch (session.status) {
      case 'awaiting_teacher_answers':
        return `/teacher/sessions/${session.id}/assessment`;
      case 'awaiting_reassessment':
      case 'awaiting_teacher_choice':
        return `/teacher/sessions/${session.id}/revision`;
      case 'generating_lesson':
      case 'draft':
      case 'published':
        return `/teacher/sessions/${session.id}/lesson`;
      default:
        return `/teacher/sessions/${session.id}/assessment`;
    }
  };

  const getStatusDisplay = (session: Session) => {
    if (session.status === 'published') return { label: 'Published', status: 'published' as const };
    if (session.status === 'draft') return { label: 'Lesson Ready', status: 'ready' as const };
    if (session.status === 'awaiting_teacher_choice') return { label: 'Choice Required', status: 'choice' as const };
    if (session.status === 'awaiting_reassessment') return { label: `Revision Round ${session.revision_rounds_completed}`, status: 'revising' as const };
    if (session.status === 'awaiting_teacher_answers') return { label: 'Diagnostic Pending', status: 'diagnostic' as const };
    return { label: session.status, status: 'diagnostic' as const };
  };

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-tm-forest-800/10 dark:border-tm-parchment/10 pb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment tracking-tight">
              Welcome back, {user?.display_name || 'Teacher'}
            </h1>
            <p className="mt-1 text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
              Manage your diagnostic sessions, view knowledge gap analytics, and craft interactive micro-lessons.
            </p>
          </div>
          <Link to="/teacher/sessions/new">
            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-sm">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Topic
            </Button>
          </Link>
        </div>

        {error && (
          <Alert type="error" title="Error Loading Sessions">
            {error}
          </Alert>
        )}

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-tm-sage/10 rounded-lg text-tm-forest-800 dark:text-tm-sage">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Total Sessions
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {sessions.length}
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-tm-terracotta/10 rounded-lg text-tm-terracotta">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Published Lessons
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {sessions.filter(s => s.status === 'published').length}
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-center space-x-4">
            <div className="p-3 bg-tm-honey/20 rounded-lg text-tm-forest-900 dark:text-tm-honey">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Avg. Readiness Score
              </p>
              <p className="text-2xl font-bold font-display text-tm-forest-900 dark:text-tm-parchment">
                {(() => {
                  const scored = sessions.filter(s => s.score !== null && s.score !== undefined);
                  if (scored.length === 0) return '—';
                  const avg = Math.round(scored.reduce((acc, s) => acc + (s.score || 0), 0) / scored.length);
                  return `${avg}%`;
                })()}
              </p>
            </div>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
              Teaching Prep Sessions
            </h2>
            <button
              onClick={loadSessions}
              className="text-xs text-tm-forest-700/70 dark:text-tm-parchment/70 hover:text-tm-terracotta transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-tm-sage/10 rounded-full flex items-center justify-center text-tm-forest-800 dark:text-tm-sage">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
                No teaching sessions yet
              </h3>
              <p className="text-sm text-tm-forest-700/80 dark:text-tm-parchment/70 max-w-md mx-auto">
                Ready to prepare your next class? Start a diagnostic session to test your baseline topic readiness and generate tailored lesson plans.
              </p>
              <Link to="/teacher/sessions/new">
                <Button variant="primary">Start Your First Topic</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session) => {
                const badge = getStatusDisplay(session);
                return (
                  <Card key={session.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-tm-forest-900 dark:text-tm-parchment">
                            {session.topic}
                          </h3>
                          <StatusBadge status={badge.status} label={badge.label} />
                          {session.readiness_override && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              Override Active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tm-forest-700/80 dark:text-tm-parchment/70">
                          <span><strong>Subject:</strong> {session.subject}</span>
                          <span>•</span>
                          <span><strong>Grade:</strong> {session.grade_level}</span>
                          <span>•</span>
                          <span><strong>Duration:</strong> {session.duration_minutes} min</span>
                          {session.score !== null && session.score !== undefined && (
                            <>
                              <span>•</span>
                              <span>
                                <strong>Score:</strong>{' '}
                                <span className={session.score >= 80 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                  {session.score}%
                                </span>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(getResumeUrl(session))}
                        >
                          {session.status === 'published' ? 'View Lesson' : 'Open / Resume'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
