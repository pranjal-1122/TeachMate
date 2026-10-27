import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsApi, RevisionDetail } from '../../api/sessions';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert, StatusBadge } from '../../components/common/ProgressBar';
import { DecisionModal } from './DecisionModal';
import { BookOpen, RefreshCw, Send, AlertTriangle, ArrowLeft } from 'lucide-react';

export const RevisionPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [revision, setRevision] = useState<RevisionDetail | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [expectedVersion, setExpectedVersion] = useState<number>(1);
  const [currentScore, setCurrentScore] = useState<number>(50);
  const [sessionStatus, setSessionStatus] = useState<string>('');

  const [qcAnswers, setQcAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);

  const loadRevision = async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const session = await sessionsApi.get(sessionId);
      setSessionTopic(session.topic);
      setExpectedVersion(session.version);
      setCurrentScore(session.score || 50);
      setSessionStatus(session.status);

      if (session.status === 'awaiting_teacher_choice') {
        setShowDecisionModal(true);
      } else if (['generating_lesson', 'draft_ready', 'published'].includes(session.status)) {
        navigate(`/teacher/sessions/${sessionId}/lesson`);
        return;
      }

      const revData = await sessionsApi.getRevision(sessionId);
      setRevision(revData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load revision materials.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevision();
  }, [sessionId]);

  const handleAnswerChange = (qId: string, text: string) => {
    setQcAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleReassessmentSubmit = async () => {
    if (!sessionId || !revision) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload = {
        answers: revision.quick_check_questions.map((qc) => ({
          question_id: qc.id,
          text: (qcAnswers[qc.id] || '').trim(),
        })),
        expected_version: expectedVersion,
      };

      const res = await sessionsApi.submitReassessment(sessionId, payload);

      if (res.status === 'generating_lesson' || res.score >= 80) {
        navigate(`/teacher/sessions/${sessionId}/lesson`);
      } else if (res.status === 'awaiting_teacher_choice') {
        setCurrentScore(res.score);
        setExpectedVersion(res.version);
        setShowDecisionModal(true);
      } else {
        // Round incremented, reload fresh revision round
        await loadRevision();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit reassessment answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedAnyway = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      await sessionsApi.submitDecision(sessionId, {
        action: 'proceed_anyway',
        acknowledge_incomplete_readiness: true,
        expected_version: expectedVersion,
      });
      navigate(`/teacher/sessions/${sessionId}/lesson`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply readiness override.');
      setIsSubmitting(false);
    }
  };

  const handleContinueRevision = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      await sessionsApi.submitDecision(sessionId, {
        action: 'continue_revision',
        acknowledge_incomplete_readiness: false,
        expected_version: expectedVersion,
      });
      setShowDecisionModal(false);
      await loadRevision();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to continue revision.');
      setIsSubmitting(false);
    }
  };

  const handleSaveForLater = async () => {
    if (!sessionId) return;
    try {
      await sessionsApi.submitDecision(sessionId, {
        action: 'save_for_later',
        acknowledge_incomplete_readiness: false,
        expected_version: expectedVersion,
      });
      navigate('/teacher/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save session.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-structure-light dark:text-structure-dark">
          Loading Targeted Revision...
        </h2>
        <p className="text-sm text-slate-muted mt-1">Isolating misconceptions and generating quick checks</p>
      </div>
    );
  }

  if (!revision) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert type="error" title="Revision Unavailable">
          {errorMsg || 'Could not load revision material for this session.'}
        </Alert>
      </div>
    );
  }

  const allQcAnswered =
    revision.quick_check_questions.length > 0 &&
    revision.quick_check_questions.every((qc) => (qcAnswers[qc.id] || '').trim().length > 0);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
              Targeted Revision
            </span>
            <StatusBadge variant="warning">
              Round {revision.round} of 3
            </StatusBadge>
          </div>
          <h1 className="text-2xl font-extrabold text-structure-light dark:text-structure-dark">
            {sessionTopic}
          </h1>
        </div>

        <span className="text-xs font-semibold text-slate-muted dark:text-slate-darkMuted tabular-nums">
          Current Mastery: {Math.round(currentScore)}%
        </span>
      </div>

      {errorMsg && (
        <Alert type="error">
          {errorMsg}
        </Alert>
      )}

      {/* Revision Content Card */}
      <Card className="p-6 sm:p-8 bg-[#FDFCF7] dark:bg-surface-dark border-line-light dark:border-line-dark shadow-subtle">
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-reading dark:text-structure-dark leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
          {revision.content}
        </div>
      </Card>

      {/* Quick Check Verification Form */}
      <Card className="p-6 sm:p-8 bg-surface-light dark:bg-[#1E3029] border-2 border-line-light dark:border-line-dark">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-structure-light dark:text-structure-dark">
            Reassessment Quick Check
          </h2>
          <p className="text-xs text-slate-reading dark:text-slate-darkMuted mt-0.5">
            Answer these 2 focused diagnostic questions to demonstrate conceptual resolution. Score ≥ 80% advances directly to the lesson.
          </p>
        </div>

        <div className="space-y-6">
          {revision.quick_check_questions.map((qc, idx) => (
            <div key={qc.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-muted">
                  Quick Check {idx + 1} • {qc.concept}
                </span>
              </div>
              <p className="text-sm font-semibold text-structure-light dark:text-structure-dark">
                {qc.prompt}
              </p>
              <textarea
                rows={4}
                required
                value={qcAnswers[qc.id] || ''}
                onChange={(e) => handleAnswerChange(qc.id, e.target.value)}
                placeholder="Type your concise, corrected understanding..."
                className="w-full p-3 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-line-light dark:border-line-dark flex items-center justify-end">
          <Button
            variant="primary"
            onClick={handleReassessmentSubmit}
            disabled={!allQcAnswered || isSubmitting}
            isLoading={isSubmitting}
            className="font-bold"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Submit Reassessment
          </Button>
        </div>
      </Card>

      {/* Decision Modal when round 3 limit reached */}
      <DecisionModal
        score={currentScore}
        isOpen={showDecisionModal}
        onProceedAnyway={handleProceedAnyway}
        onContinueRevision={handleContinueRevision}
        onSaveForLater={handleSaveForLater}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
