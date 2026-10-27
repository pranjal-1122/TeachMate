import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsApi, AssessmentQuestion } from '../../api/sessions';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ProgressBar, Alert, StatusBadge } from '../../components/common/ProgressBar';
import { ArrowLeft, ArrowRight, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expectedVersion, setExpectedVersion] = useState<number>(1);
  const [sessionTopic, setSessionTopic] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch assessment questions
  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const session = await sessionsApi.get(sessionId);
        setSessionTopic(session.topic);
        setExpectedVersion(session.version);

        // If already past assessment, redirect appropriately
        if (session.status === 'awaiting_reassessment') {
          navigate(`/teacher/sessions/${sessionId}/revision`);
          return;
        } else if (['generating_lesson', 'draft_ready', 'published'].includes(session.status)) {
          navigate(`/teacher/sessions/${sessionId}/lesson`);
          return;
        }

        const res = await sessionsApi.getAssessment(sessionId);
        setQuestions(res.questions);

        // Restore any locally cached drafts
        const draftKey = `teachmate_draft_${sessionId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            setAnswers(JSON.parse(savedDraft));
          } catch (e) {}
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load assessment questions.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sessionId, navigate]);

  // Persist draft on change
  const handleAnswerChange = (text: string) => {
    if (!questions[currentIdx]) return;
    const qid = questions[currentIdx].id;
    const updated = { ...answers, [qid]: text };
    setAnswers(updated);
    if (sessionId) {
      localStorage.setItem(`teachmate_draft_${sessionId}`, JSON.stringify(updated));
    }
  };

  const currentQ = questions[currentIdx];
  const answeredCount = questions.filter((q) => (answers[q.id] || '').trim().length > 0).length;
  const allAnswered = questions.length === 5 && answeredCount === 5;

  const currentAnswerText = currentQ ? (answers[currentQ.id] || '') : '';

  const selectedOptionId = (() => {
    if (!currentQ || currentQ.format !== 'mcq') return null;
    const match = currentAnswerText.match(/Selected Option:\s*\[([A-D])\]/i) || currentAnswerText.match(/^Option\s*([A-D])/i);
    return match ? match[1].toUpperCase() : null;
  })();

  const currentRationale = (() => {
    if (!currentQ || currentQ.format !== 'mcq') return '';
    const parts = currentAnswerText.split(/\nRationale:\s*/i);
    return parts.length > 1 ? parts[1] : '';
  })();

  const handleSelectOption = (optId: string, optText: string) => {
    const rationalePart = currentRationale.trim() ? `\nRationale: ${currentRationale.trim()}` : '';
    const formatted = `Selected Option: [${optId}] ${optText}${rationalePart}`;
    handleAnswerChange(formatted);
  };

  const handleRationaleChange = (newRationale: string) => {
    if (!selectedOptionId || !currentQ.options) return;
    const currentOpt = currentQ.options.find((o) => o.id === selectedOptionId);
    const optText = currentOpt ? currentOpt.text : '';
    const rationalePart = newRationale.trim() ? `\nRationale: ${newRationale.trim()}` : '';
    const formatted = `Selected Option: [${selectedOptionId}] ${optText}${rationalePart}`;
    handleAnswerChange(formatted);
  };

  const handleSubmit = async () => {
    if (!sessionId || !allAnswered) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          text: answers[q.id].trim(),
        })),
        expected_version: expectedVersion,
      };

      const res = await sessionsApi.submitAnswers(sessionId, payload);

      // Clear local draft on success
      localStorage.removeItem(`teachmate_draft_${sessionId}`);

      // Navigate to Analysis page
      navigate(`/teacher/sessions/${sessionId}/analysis`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit answers for evaluation.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-structure-light dark:text-structure-dark">
          Loading Assessment Questions...
        </h2>
        <p className="text-sm text-slate-muted mt-1">Evaluating curriculum rubrics for {sessionTopic}</p>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert type="error" title="Error Loading Assessment">
          {errorMsg || 'Could not load questions for this session.'}
        </Alert>
      </div>
    );
  }

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const isMCQ = currentQ.format === 'mcq' && Boolean(currentQ.options && currentQ.options.length > 0);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header Topic & Progress Bar */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-xs uppercase font-bold text-accent dark:text-accent-dark tracking-wider">
              Diagnostic Assessment
            </span>
            <h1 className="text-2xl font-extrabold text-structure-light dark:text-structure-dark">
              {sessionTopic}
            </h1>
          </div>
          <span className="text-sm font-semibold text-slate-reading dark:text-structure-dark tabular-nums">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        <ProgressBar
          value={((currentIdx + 1) / questions.length) * 100}
          showNumeric={false}
        />
      </div>

      {errorMsg && (
        <Alert type="error" className="mb-6">
          {errorMsg}
        </Alert>
      )}

      {/* Main Question Card */}
      <Card className="p-6 sm:p-8 bg-[#FDFCF7] dark:bg-surface-dark border-2 border-line-light dark:border-line-dark shadow-raised mb-6">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusBadge variant={isMCQ ? 'accent' : 'neutral'}>
            {isMCQ ? 'Multiple Choice' : 'Written Explanation'}
          </StatusBadge>
          <StatusBadge variant="neutral">
            Concept: {currentQ.concept}
          </StatusBadge>
          <StatusBadge variant={getDifficultyVariant(currentQ.difficulty)}>
            {currentQ.difficulty}
          </StatusBadge>
          <StatusBadge variant="neutral">
            {currentQ.type}
          </StatusBadge>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-bold text-structure-light dark:text-structure-dark mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Input Interface: MCQ Options vs Theoretical Textarea */}
        {isMCQ ? (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-3">
                Select Option *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {currentQ.options?.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id, opt.text)}
                      className={`w-full flex items-start gap-3.5 p-4 rounded-card border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent/10 dark:bg-accent/25 text-structure-light dark:text-structure-dark font-medium shadow-sm'
                          : 'border-line-light dark:border-line-dark hover:border-accent/40 bg-white dark:bg-[#1E3029]/70 text-slate-reading dark:text-slate-darkReading'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-accent text-white dark:bg-accent-dark'
                            : 'bg-[#EDE9DE] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark'
                        }`}
                      >
                        {opt.id}
                      </div>
                      <span className="text-sm leading-relaxed pt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Rationale */}
            <div className="pt-2 border-t border-line-light dark:border-line-dark">
              <label
                htmlFor="rationaleInput"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-2"
              >
                Teacher Rationale / Pedagogical Notes (Optional)
              </label>
              <textarea
                id="rationaleInput"
                rows={3}
                value={currentRationale}
                onChange={(e) => handleRationaleChange(e.target.value)}
                placeholder="Explain why you selected this option or how you clarify this to students..."
                className="w-full p-3 text-sm rounded-card bg-[#F5F3ED] dark:bg-[#1E3029] border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none resize-y leading-relaxed font-sans"
              />
              <div className="flex justify-between items-center text-xs text-slate-muted mt-2">
                <span>{selectedOptionId ? `Option ${selectedOptionId} selected` : 'Select an option above to answer'}</span>
                <span>Draft auto-saved</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="answerInput"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-2"
            >
              Your Explanation / Pedagogical Answer *
            </label>
            <textarea
              id="answerInput"
              rows={7}
              required
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your explanation as you would present or justify this concept in class..."
              className="w-full p-4 text-sm rounded-card bg-[#F5F3ED] dark:bg-[#1E3029] border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none resize-y leading-relaxed font-sans"
            />
            <div className="flex justify-between items-center text-xs text-slate-muted mt-2">
              <span>Draft automatically saved locally</span>
              <span className="tabular-nums">
                {(answers[currentQ.id] || '').length} characters
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Bottom Step Navigation & Submit Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Previous Question
        </Button>

        <div className="flex items-center gap-2">
          {currentIdx < questions.length - 1 ? (
            <Button
              variant="secondary"
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
            >
              Next Question
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!allAnswered}
              isLoading={isSubmitting}
              className="font-bold"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Submit All Answers ({answeredCount}/5)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
