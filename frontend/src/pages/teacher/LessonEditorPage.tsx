import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lessonsApi, LessonDetail } from '../../api/lessons';
import { sessionsApi } from '../../api/sessions';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert, StatusBadge } from '../../components/common/ProgressBar';
import { DiagramRenderer } from '../../components/common/DiagramRenderer';
import {
  Save, Share2, CheckCircle2, AlertTriangle, Eye,
  BookOpen, Sparkles, Clock, HelpCircle, ArrowRight
} from 'lucide-react';

export const LessonEditorPage: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [readinessOverride, setReadinessOverride] = useState<boolean>(false);
  const [sessionVersion, setSessionVersion] = useState<number>(1);

  // Editable local state
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadLesson = async () => {
      try {
        setIsLoading(true);
        const session = await sessionsApi.get(sessionId);
        setSessionVersion(session.version);

        const res = await lessonsApi.getSessionLesson(sessionId);
        setLesson(res.lesson);
        setTitle(res.lesson.title);
        setSummary(res.lesson.summary);
        setReadinessOverride(res.readiness_override);
      } catch (err: any) {
        setNotification({
          type: 'error',
          message: err.message || 'Failed to load lesson plan.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [sessionId]);

  const handleSaveDraft = async () => {
    if (!sessionId || !lesson) return;
    setIsSaving(true);
    setNotification(null);

    try {
      const updated = await lessonsApi.updateLesson(sessionId, {
        title,
        summary,
        expected_version: sessionVersion,
      });
      setLesson(updated);
      setSessionVersion((prev) => prev + 1);
      setIsEditing(false);
      setNotification({
        type: 'success',
        message: 'Lesson draft saved successfully.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save lesson draft.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!sessionId || !lesson) return;
    setIsPublishing(true);
    setNotification(null);

    try {
      await lessonsApi.publishLesson(sessionId, sessionVersion);
      setLesson((prev) => (prev ? { ...prev, visibility: 'published' } : null));
      setNotification({
        type: 'success',
        message: 'Lesson successfully published to the student catalog!',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to publish lesson.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-structure-light dark:text-structure-dark">
          Generating Classroom Lesson & Quiz...
        </h2>
        <p className="text-sm text-slate-muted mt-1">
          Structuring learning objectives, narrative storytelling, diagrams, and student questions
        </p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Alert type="error" title="Lesson Unavailable">
          {notification?.message || 'Could not load lesson plan.'}
        </Alert>
      </div>
    );
  }

  const isPublished = lesson.visibility === 'published';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Notifications */}
      {notification && (
        <Alert type={notification.type} className="mb-4">
          {notification.message}
        </Alert>
      )}

      {/* Readiness Override Disclaimer Banner */}
      {readinessOverride && (
        <Alert type="warning" title="Teacher Readiness Override Active">
          This lesson plan was generated with an acknowledged readiness override ({lesson.topic}). Extra introductory scaffolding and foundational explanations have been incorporated.
        </Alert>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-light dark:border-line-dark pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase font-bold text-accent dark:text-accent-dark tracking-wider">
              {lesson.subject} • {lesson.grade_level}
            </span>
            <StatusBadge variant={isPublished ? 'success' : 'neutral'}>
              {isPublished ? 'Published to Catalog' : 'Draft Ready'}
            </StatusBadge>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl sm:text-3xl font-extrabold w-full px-3 py-1.5 rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-structure-light dark:text-structure-dark focus:border-accent"
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-extrabold text-structure-light dark:text-structure-dark">
              {title}
            </h1>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDraft}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Changes
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Details
            </Button>
          )}

          {!isPublished ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublish}
              isLoading={isPublishing}
              className="bg-accent hover:bg-accent-hover text-[#192A25] font-bold"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Publish to Students
            </Button>
          ) : (
            <Link to={`/lessons/${lesson.id}`}>
              <Button variant="secondary" size="sm">
                <Eye className="w-4 h-4 mr-1.5" />
                View as Student
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Learning Objectives Card */}
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-bold text-structure-light dark:text-structure-dark mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-accent dark:text-accent-dark" />
          Learning Objectives
        </h2>
        <ul className="space-y-2.5">
          {lesson.objectives.map((obj, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm text-slate-reading dark:text-structure-dark"
            >
              <span className="w-5 h-5 rounded-full bg-surface-light dark:bg-[#1E3029] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-line-light dark:border-line-dark">
                {idx + 1}
              </span>
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Lesson Sections Stack */}
      <div className="space-y-6">
        {lesson.sections.map((section, idx) => (
          <Card key={idx} className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-structure-light dark:text-structure-dark mb-4">
              {section.heading}
            </h3>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-reading dark:text-structure-dark text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </Card>
        ))}
      </div>

      {/* Interactive Visual Diagrams */}
      {lesson.visual_specs && lesson.visual_specs.length > 0 && (
        <Card className="p-6 sm:p-8">
          <h3 className="text-lg font-bold text-structure-light dark:text-structure-dark mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent dark:text-accent-dark" />
            Visual Explanations & Diagrams
          </h3>
          <div className="space-y-4">
            {lesson.visual_specs.map((v, idx) => (
              <DiagramRenderer
                key={idx}
                spec={v.spec}
                title={v.title}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Classroom Activities */}
      {lesson.activities && lesson.activities.length > 0 && (
        <Card className="p-6 sm:p-8">
          <h3 className="text-lg font-bold text-structure-light dark:text-structure-dark mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent dark:text-accent-dark" />
            Classroom Activities & Hands-On Exercises
          </h3>
          <div className="space-y-4">
            {lesson.activities.map((act, idx) => (
              <div
                key={idx}
                className="p-4 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-base font-bold text-structure-light dark:text-structure-dark">
                    {act.title}
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E2DEC9] dark:bg-[#253A31] text-slate-reading dark:text-structure-dark flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {act.duration_minutes} min
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-reading dark:text-slate-darkMuted leading-relaxed whitespace-pre-wrap">
                  {act.instructions}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lesson Summary */}
      <Card className="p-6 sm:p-8 bg-surface-light dark:bg-surface-dark border-2 border-line-light dark:border-line-dark">
        <h3 className="text-lg font-bold text-structure-light dark:text-structure-dark mb-3">
          Lesson Summary
        </h3>
        {isEditing ? (
          <textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-3 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent"
          />
        ) : (
          <p className="text-sm sm:text-base text-slate-reading dark:text-structure-dark leading-relaxed">
            {summary}
          </p>
        )}
      </Card>
    </div>
  );
};
