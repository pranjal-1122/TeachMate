import React, { useState, useEffect } from 'react';
import { MicroLessonCard } from '../../api/lessons';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { DiagramRenderer } from '../common/DiagramRenderer';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import {
  ChevronDown, ChevronUp, CheckCircle, Clock,
  BookOpen, HelpCircle, Eye, Sparkles, ArrowRight
} from 'lucide-react';

interface ScrollCardStackProps {
  cards: MicroLessonCard[];
  completedCardIds: Set<string>;
  onMarkComplete: (cardId: string) => Promise<void>;
  onTakeQuiz?: () => void;
  quizAvailable?: boolean;
}

export const ScrollCardStack: React.FC<ScrollCardStackProps> = ({
  cards,
  completedCardIds,
  onMarkComplete,
  onTakeQuiz,
  quizAvailable = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMarking, setIsMarking] = useState<boolean>(false);

  // Keyboard navigation support (ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length]);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12 text-slate-muted dark:text-slate-darkMuted">
        No learning cards available for this lesson.
      </div>
    );
  }

  const currentCard = cards[activeIndex];
  const isCompleted = completedCardIds.has(currentCard.id);
  const totalCompleted = cards.filter((c) => completedCardIds.has(c.id)).length;
  const progressPercent = Math.round((totalCompleted / cards.length) * 100);

  const handleCompleteCurrent = async () => {
    setIsMarking(true);
    try {
      await onMarkComplete(currentCard.id);
      // Auto-advance to next card if available
      if (activeIndex < cards.length - 1) {
        setActiveIndex((prev) => prev + 1);
      }
    } finally {
      setIsMarking(false);
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'concept':
        return <BookOpen className="w-4 h-4 text-structure-light dark:text-accent-dark" />;
      case 'diagram':
        return <Eye className="w-4 h-4 text-structure-light dark:text-accent-dark" />;
      case 'example':
        return <Sparkles className="w-4 h-4 text-structure-light dark:text-accent-dark" />;
      case 'micro_quiz':
      case 'reflection':
      default:
        return <HelpCircle className="w-4 h-4 text-structure-light dark:text-accent-dark" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Progress & Card Counter Header */}
      <div className="bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-card p-4 shadow-subtle">
        <div className="flex items-center justify-between text-xs text-slate-muted dark:text-slate-darkMuted mb-2">
          <span className="font-semibold text-structure-light dark:text-structure-dark uppercase tracking-wider text-[11px]">
            Card {activeIndex + 1} of {cards.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            ~{currentCard.estimated_read_time_seconds || 60}s read
          </span>
        </div>
        <ProgressBar
          value={progressPercent}
          label={`${totalCompleted} of ${cards.length} cards completed`}
        />
      </div>

      {/* Primary Focused Learning Card */}
      <Card
        tabIndex={0}
        aria-label={`Learning Card: ${currentCard.title}`}
        className="min-h-[380px] flex flex-col justify-between p-6 sm:p-8 bg-[#FDFCF7] dark:bg-surface-dark border-2 border-line-light dark:border-line-dark shadow-raised transition-all"
      >
        <div>
          {/* Card Type Badge & Completion Indicator */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-light dark:bg-[#1E3029] text-structure-light dark:text-structure-dark border border-line-light dark:border-line-dark capitalize">
              {getCardIcon(currentCard.card_type)}
              {currentCard.card_type.replace('_', ' ')}
            </div>

            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-state-success dark:text-[#A1DEBC]">
                <CheckCircle className="w-4 h-4" />
                Completed
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-structure-light dark:text-structure-dark mb-4 leading-snug">
            {currentCard.title}
          </h3>

          {/* Markdown Content */}
          <MarkdownRenderer content={currentCard.content_markdown} />

          {/* Render Interactive Diagram if card_type == 'diagram' or media_spec has diagram */}
          {currentCard.media_spec?.spec && (
            <div className="mt-6">
              <DiagramRenderer
                spec={currentCard.media_spec.spec}
                title={currentCard.title}
              />
            </div>
          )}
        </div>

        {/* Card Footer Controls */}
        <div className="pt-6 mt-6 border-t border-line-light dark:border-line-dark flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              aria-label="Previous card"
            >
              <ChevronUp className="w-4 h-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveIndex((prev) => Math.min(cards.length - 1, prev + 1))}
              disabled={activeIndex === cards.length - 1}
              aria-label="Next card"
            >
              Next
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCompleteCurrent}
                isLoading={isMarking}
              >
                <CheckCircle className="w-4 h-4 -ml-0.5" />
                Mark Complete
              </Button>
            ) : (
              <span className="text-xs text-state-success dark:text-[#A1DEBC] font-medium mr-2">
                Card Completed
              </span>
            )}

            {/* Quiz CTA at end of cards */}
            {activeIndex === cards.length - 1 && quizAvailable && onTakeQuiz && (
              <Button
                variant="primary"
                size="sm"
                onClick={onTakeQuiz}
                className="font-bold bg-accent hover:bg-accent-hover text-[#192A25]"
              >
                Take Quiz
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Accessible Navigation Hint */}
      <p className="text-center text-xs text-slate-muted dark:text-slate-darkMuted">
        Tip: Use keyboard <kbd className="px-1.5 py-0.5 bg-surface-light dark:bg-surface-dark border rounded text-[11px]">↓</kbd> or{' '}
        <kbd className="px-1.5 py-0.5 bg-surface-light dark:bg-surface-dark border rounded text-[11px]">↑</kbd> to navigate cards.
      </p>
    </div>
  );
};
