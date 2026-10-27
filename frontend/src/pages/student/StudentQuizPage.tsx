import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lessonsApi, PublicQuizPayload, QuizAttemptResult } from '../../api/lessons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Alert } from '../../components/common/Alert';

export const StudentQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<PublicQuizPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadQuiz(id);
    }
  }, [id]);

  const loadQuiz = async (lessonId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await lessonsApi.getQuiz(lessonId);
      setQuiz(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (result) return; // Do not allow change after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check all answered
    const unanswered = quiz.questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all ${quiz.questions.length} questions before submitting.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const answersPayload = quiz.questions.map((q) => ({
        question_id: q.id,
        selected_option_id: selectedAnswers[q.id],
      }));

      const res = await lessonsApi.submitQuizAttempt(quiz.quiz_id, {
        answers: answersPayload,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit quiz attempt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-12 max-w-2xl mx-auto space-y-4">
        <Alert type="error" title="Quiz Unavailable">
          {error}
        </Alert>
        <Link to={`/student/lessons/${id}`}>
          <Button variant="secondary">← Back to Lesson</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-tm-forest-800/10 dark:border-tm-parchment/10 pb-4">
          <Link
            to={`/student/lessons/${id}`}
            className="inline-flex items-center text-sm font-medium text-tm-forest-700/80 dark:text-tm-parchment/70 hover:text-tm-terracotta transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lesson
          </Link>
          <span className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/60 dark:text-tm-parchment/60 font-mono">
            Knowledge Check
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-tm-forest-900 dark:text-tm-parchment">
            {quiz?.title || 'Lesson Quiz'}
          </h1>
          <p className="mt-1 text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
            Answer the 5 multiple-choice questions below to test your understanding and earn streak credits.
          </p>
        </div>

        {error && (
          <Alert type="error" title="Error">
            {error}
          </Alert>
        )}

        {/* Results Banner when Submitted */}
        {result && (
          <Card className="p-6 border-2 border-tm-terracotta bg-tm-terracotta/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-tm-terracotta">
                  Attempt Results
                </span>
                <h2 className="text-3xl font-display font-bold text-tm-forest-900 dark:text-tm-parchment">
                  Score: {result.score}%
                </h2>
                <p className="text-sm text-tm-forest-700/80 dark:text-tm-parchment/70 mt-1">
                  You got {result.correct_count} out of {result.total} questions correct.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/student/lessons/${id}`)}>
                  Review Lesson
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/explore')}>
                  Next Lesson →
                </Button>
              </div>
            </div>

            {result.earned_badges && result.earned_badges.length > 0 && (
              <div className="pt-3 border-t border-tm-terracotta/20 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs font-bold text-tm-terracotta uppercase tracking-wider">
                    Badge Awarded!
                  </p>
                  <p className="text-sm font-semibold text-tm-forest-900 dark:text-tm-parchment">
                    {result.earned_badges.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {quiz?.questions.map((q, idx) => {
            const feedbackItem = result?.feedback.find((f) => f.question_id === q.id);

            return (
              <Card
                key={q.id}
                className={`p-6 space-y-4 transition-all ${
                  feedbackItem
                    ? feedbackItem.correct
                      ? 'border-emerald-500/50 dark:border-emerald-600/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-red-500/50 dark:border-red-600/50 bg-red-50/20 dark:bg-red-950/10'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-tm-forest-800/10 dark:bg-tm-parchment/10 text-tm-forest-800 dark:text-tm-parchment">
                    Question {idx + 1}
                  </span>
                  {feedbackItem && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        feedbackItem.correct
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {feedbackItem.correct ? '✓ Correct' : '✕ Incorrect'}
                    </span>
                  )}
                </div>

                <p className="text-base font-medium text-tm-forest-900 dark:text-tm-parchment">
                  {q.question_text}
                </p>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedAnswers[q.id] === opt.id;
                    const isCorrect = feedbackItem?.correct_option_id === opt.id;
                    const isWrongSelection = feedbackItem && !feedbackItem.correct && isSelected;

                    let optStyle = 'border-tm-forest-800/15 dark:border-tm-parchment/15 hover:border-tm-terracotta/50';
                    if (isSelected && !feedbackItem) {
                      optStyle = 'border-tm-terracotta bg-tm-terracotta/5 text-tm-forest-900 dark:text-tm-parchment ring-1 ring-tm-terracotta';
                    }
                    if (feedbackItem) {
                      if (isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                      } else if (isWrongSelection) {
                        optStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 line-through';
                      } else {
                        optStyle = 'border-tm-forest-800/10 dark:border-tm-parchment/10 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={!!result}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-start gap-3 ${optStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            isSelected
                              ? 'border-tm-terracotta bg-tm-terracotta text-white'
                              : 'border-tm-forest-800/30 dark:border-tm-parchment/30 text-tm-forest-700 dark:text-tm-parchment/70'
                          }`}
                        >
                          {opt.id.toUpperCase()}
                        </span>
                        <span className="flex-1 text-tm-forest-900 dark:text-tm-parchment">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation feedback after submission */}
                {feedbackItem && feedbackItem.explanation && (
                  <div className="pt-3 border-t border-tm-forest-800/10 dark:border-tm-parchment/10 text-xs text-tm-forest-700/90 dark:text-tm-parchment/80">
                    <strong className="text-tm-forest-900 dark:text-tm-parchment font-semibold">Explanation:</strong>{' '}
                    {feedbackItem.explanation}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Submit Button */}
        {!result && (
          <div className="pt-4 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              isLoading={submitting}
              disabled={submitting || Object.keys(selectedAnswers).length < (quiz?.questions.length || 5)}
              className="w-full sm:w-auto"
            >
              Submit Quiz ({Object.keys(selectedAnswers).length}/{quiz?.questions.length || 5} answered)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
