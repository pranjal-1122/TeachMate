import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  BookOpen, Brain, Sparkles, CheckCircle2,
  ArrowRight, ShieldCheck, RefreshCw, Trophy, Users
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="text-center pt-12 sm:pt-20 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-light dark:bg-surface-dark text-slate-reading dark:text-structure-dark border border-line-light dark:border-line-dark mb-6 shadow-subtle">
          <Brain className="w-3.5 h-3.5 text-accent dark:text-accent-dark" />
          <span>Agentic Teaching & Learning Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-structure-light dark:text-structure-dark tracking-tight leading-[1.15] mb-6">
          From Teacher Assessment to <span className="text-accent dark:text-accent-dark">Adaptive Lesson Preparation</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-reading/90 dark:text-structure-dark/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          TeachMate doesn’t just generate a generic lesson. It assesses your conceptual understanding, identifies knowledge gaps, delivers targeted revision, and crafts classroom-ready plans with interactive student quizzes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="font-bold shadow-raised">
              Start Free as Teacher
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <Link to="/lessons">
            <Button variant="secondary" size="lg">
              Explore Published Lessons
            </Button>
          </Link>
        </div>
      </section>

      {/* The Agentic Difference Flowchart */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-structure-light dark:text-structure-dark mb-3">
            Why TeachMate is Agentic
          </h2>
          <p className="text-sm sm:text-base text-slate-muted dark:text-slate-darkMuted max-w-xl mx-auto">
            Traditional AI outputs a generic prompt chain. TeachMate operates with state, perception, deterministic routing, and safe feedback loops.
          </p>
        </div>

        <Card className="p-6 sm:p-10 bg-[#FDFCF7] dark:bg-surface-dark border-line-light dark:border-line-dark shadow-raised">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="flex flex-col items-center text-center p-4 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark">
              <div className="w-10 h-10 rounded-full bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25] flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-structure-light dark:text-structure-dark mb-1">5-Step Assessment</h3>
              <p className="text-xs text-slate-reading dark:text-slate-darkMuted">
                Generates 5 conceptual and misconception-focused questions for the teacher.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark">
              <div className="w-10 h-10 rounded-full bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25] flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-structure-light dark:text-structure-dark mb-1">Rubric Analysis</h3>
              <p className="text-xs text-slate-reading dark:text-slate-darkMuted">
                Evaluates each answer against server rubrics; extracts strengths and structured gaps.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark">
              <div className="w-10 h-10 rounded-full bg-accent text-[#192A25] dark:bg-accent-dark flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-structure-light dark:text-structure-dark mb-1">Adaptive Decision</h3>
              <p className="text-xs text-slate-reading dark:text-slate-darkMuted">
                Score ≥ 80% advances to lesson; &lt; 80% triggers targeted revision (capped at 3 rounds).
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark">
              <div className="w-10 h-10 rounded-full bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25] flex items-center justify-center font-bold mb-3">
                4
              </div>
              <h3 className="font-bold text-structure-light dark:text-structure-dark mb-1">Lesson & Quiz</h3>
              <p className="text-xs text-slate-reading dark:text-slate-darkMuted">
                Crafts story, diagrams, activities, and an interactive 5-question student quiz.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Role Comparison */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25] flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-structure-light dark:text-structure-dark">
            For Teachers: Preparation with Feedback
          </h3>
          <ul className="space-y-3 text-sm text-slate-reading dark:text-structure-dark">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Diagnose hidden conceptual misconceptions before standing in front of students.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Targeted, bite-sized revision notes generated specifically for your identified gaps.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Rich lesson drafts with storytelling hooks, Mermaid diagrams, and classroom experiments.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Editable preview and one-click publishing to student catalog.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-accent text-[#192A25] dark:bg-accent-dark flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-structure-light dark:text-structure-dark">
            For Students: Micro Scroll-Learning
          </h3>
          <ul className="space-y-3 text-sm text-slate-reading dark:text-structure-dark">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Bite-sized vertical card stack designed for focused learning without distraction.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Interactive visual flowcharts and hands-on experiments per topic.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>5-question interactive quizzes graded with detailed pedagogical explanations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Earn streaks and legitimate achievement badges backed by actual completions.</span>
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
};
