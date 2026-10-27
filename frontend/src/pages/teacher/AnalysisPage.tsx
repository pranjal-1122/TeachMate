import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionsApi, AnalysisDetail } from '../../api/sessions';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert, StatusBadge } from '../../components/common/ProgressBar';
import {
  CheckCircle2, AlertTriangle, ArrowRight, BookOpen,
  Award, Brain, FileText, ChevronRight
} from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadAnalysis = async () => {
      try {
        setIsLoading(true);
        const session = await sessionsApi.get(sessionId);
        setSessionTopic(session.topic);

        const data = await sessionsApi.getAnalysis(sessionId);
        setAnalysis(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load knowledge analysis.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-structure-light dark:text-structure-dark">
          Analyzing Answers Against Rubrics...
        </h2>
        <p className="text-sm text-slate-muted mt-1">Evaluating evidence, calculating mastery score, and isolating gaps</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert type="error" title="Analysis Unavailable">
          {errorMsg || 'Could not load analysis details for this session.'}
        </Alert>
      </div>
    );
  }

  const isReady = analysis.score >= 80.0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
          Evaluation Report
        </span>
        <h1 className="text-3xl font-extrabold text-structure-light dark:text-structure-dark mt-1">
          Knowledge Diagnostic: {sessionTopic}
        </h1>
        <p className="text-sm text-slate-muted dark:text-slate-darkMuted mt-1">
          Objective rubric-based evaluation of your submitted answers.
        </p>
      </div>

      {/* Primary Score Banner & Decision Routing */}
      <Card
        variant={isReady ? 'default' : 'highlight'}
        className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold text-2xl tabular-nums shadow-subtle shrink-0 ${
              isReady
                ? 'bg-state-success text-[#F5F3ED]'
                : 'bg-state-warning text-[#F5F3ED]'
            }`}
          >
            <span>{Math.round(analysis.score)}%</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
              Score
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-muted dark:text-slate-darkMuted">
                Decision Status
              </span>
              <StatusBadge variant={isReady ? 'success' : 'warning'}>
                {isReady ? 'Mastery Verified' : 'Revision Recommended'}
              </StatusBadge>
            </div>
            <h2 className="text-xl font-bold text-structure-light dark:text-structure-dark">
              {isReady
                ? 'Sufficient Readiness for Lesson Generation'
                : 'Targeted Knowledge Gaps Identified'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-reading dark:text-slate-darkMuted mt-1 max-w-xl">
              {isReady
                ? 'Your responses demonstrated strong mastery of the curriculum principles and misconceptions. You are ready to generate the classroom lesson.'
                : 'A few specific concepts need reinforcement before generating the lesson. Review the targeted revision to strengthen these areas.'}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 w-full md:w-auto">
          {isReady ? (
            <Link to={`/teacher/sessions/${sessionId}/lesson`}>
              <Button size="lg" className="w-full md:w-auto font-bold shadow-raised">
                Generate Lesson Plan
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <Link to={`/teacher/sessions/${sessionId}/revision`}>
              <Button size="lg" className="w-full md:w-auto font-bold shadow-raised">
                Start Targeted Revision
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Strengths & Knowledge Gaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-state-success" />
            <h3 className="text-lg font-bold text-structure-light dark:text-structure-dark">
              Demonstrated Strengths
            </h3>
          </div>
          <ul className="space-y-2.5">
            {analysis.strengths.map((str, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-reading dark:text-structure-dark"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-state-success mt-2 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Knowledge Gaps Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-state-warning" />
            <h3 className="text-lg font-bold text-structure-light dark:text-structure-dark">
              Identified Knowledge Gaps
            </h3>
          </div>
          {analysis.gaps.length === 0 ? (
            <p className="text-sm text-slate-muted">No significant knowledge gaps identified.</p>
          ) : (
            <div className="space-y-3">
              {analysis.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-structure-light dark:text-structure-dark">
                      {gap.concept}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        gap.severity === 'significant'
                          ? 'bg-[#F7E5E4] text-state-danger'
                          : 'bg-[#F9F1DF] text-state-warning'
                      }`}
                    >
                      {gap.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-reading dark:text-slate-darkMuted leading-relaxed">
                    {gap.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Per-Question Detailed Feedback */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-structure-light dark:text-structure-dark mb-4">
          Detailed Question-by-Question Rubric Feedback
        </h3>
        <div className="divide-y divide-line-light dark:divide-line-dark">
          {analysis.per_question_feedback.map((item, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-muted">
                  Question {item.question_position}
                </span>
                <span className="text-xs font-bold text-structure-light dark:text-structure-dark tabular-nums">
                  Score: {item.score}/100
                </span>
              </div>
              <p className="text-sm font-medium text-structure-light dark:text-structure-dark mb-1">
                {item.feedback}
              </p>
              {item.evidence && (
                <p className="text-xs text-slate-muted dark:text-slate-darkMuted italic">
                  Evidence cited: "{item.evidence}"
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
