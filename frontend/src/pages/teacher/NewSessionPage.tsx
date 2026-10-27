import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsApi } from '../../api/sessions';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/ProgressBar';
import { Sparkles, ArrowRight, BookOpen, Clock, Layers } from 'lucide-react';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [gradeLevel, setGradeLevel] = useState('Grade 9-10 (High School)');
  const [duration, setDuration] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await sessionsApi.create({
        topic: topic.trim(),
        subject,
        grade_level: gradeLevel,
        duration_minutes: duration,
      });

      // Redirect immediately to assessment questions
      navigate(`/teacher/sessions/${res.session_id}/assessment`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start session. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-structure-light dark:text-structure-dark">
          Prepare a New Lesson
        </h1>
        <p className="text-sm text-slate-reading/80 dark:text-structure-dark/80 mt-1">
          TeachMate will evaluate your conceptual depth with 5 diagnostic questions before generating the classroom lesson.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        {errorMsg && (
          <Alert type="error" className="mb-6">
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Input */}
          <div>
            <label
              htmlFor="topic"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
            >
              Lesson Topic / Concept *
            </label>
            <input
              id="topic"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Laws of Motion, Photosynthesis, or Linear Equations"
              className="w-full px-4 py-2.5 text-base rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-slate-muted dark:text-slate-darkMuted mt-1">
              Be specific for more targeted conceptual questions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject Dropdown */}
            <div>
              <label
                htmlFor="subject"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
              >
                Subject
              </label>
              <div className="relative">
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>
            </div>

            {/* Grade Level Dropdown */}
            <div>
              <label
                htmlFor="gradeLevel"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
              >
                Target Grade / Level
              </label>
              <select
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              >
                <option value="Grade 6-8 (Middle School)">Grade 6-8 (Middle School)</option>
                <option value="Grade 9-10 (High School)">Grade 9-10 (High School)</option>
                <option value="Grade 11-12 (Senior Secondary)">Grade 11-12 (Senior Secondary)</option>
                <option value="Undergraduate">Undergraduate</option>
              </select>
            </div>
          </div>

          {/* Lesson Duration */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="duration"
                className="text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark"
              >
                Classroom Lesson Duration
              </label>
              <span className="text-sm font-bold text-accent dark:text-accent-dark tabular-nums">
                {duration} minutes
              </span>
            </div>
            <input
              id="duration"
              type="range"
              min={20}
              max={90}
              step={5}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full accent-accent h-2 bg-surface-light dark:bg-surface-dark rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-muted mt-1">
              <span>20 min (Micro-session)</span>
              <span>45 min (Standard class)</span>
              <span>90 min (Extended block)</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-line-light dark:border-line-dark">
            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-subtle"
            >
              {isLoading ? 'Generating Assessment Questions...' : 'Start Assessment'}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-1" />}
            </Button>
            {isLoading && (
              <p className="text-center text-xs text-slate-muted dark:text-slate-darkMuted mt-3 animate-pulse">
                TeachMate AI is evaluating curriculum rubrics to generate 5 diagnostic questions...
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};
