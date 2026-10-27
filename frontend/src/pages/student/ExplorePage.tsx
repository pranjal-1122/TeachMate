import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsApi, LessonCatalogItem } from '../../api/lessons';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Alert } from '../../components/common/Alert';

const SUBJECT_OPTIONS = ['All', 'Physics', 'Mathematics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature'];
const GRADE_OPTIONS = ['All', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'];

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLessons();
  }, [selectedSubject, selectedGrade]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { subject?: string; grade_level?: string; q?: string } = {};
      if (selectedSubject !== 'All') params.subject = selectedSubject;
      if (selectedGrade !== 'All') params.grade_level = selectedGrade;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await lessonsApi.listCatalog(params);
      setLessons(res.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lesson catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLessons();
  };

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Title & Intro */}
        <div className="border-b border-tm-forest-800/10 dark:border-tm-parchment/10 pb-6">
          <h1 className="text-3xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment tracking-tight">
            Explore Micro-Lessons
          </h1>
          <p className="mt-1 text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
            Bite-sized, diagram-rich micro-lessons prepared and verified by educators. Complete cards, test your knowledge, and earn badges.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by topic, keyword, or concept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 rounded-md border border-tm-forest-800/20 dark:border-tm-parchment/20 bg-tm-parchment dark:bg-tm-forest-800 text-tm-forest-900 dark:text-tm-parchment placeholder-tm-forest-700/50 dark:placeholder-tm-parchment/40 focus:outline-none focus:ring-2 focus:ring-tm-terracotta text-sm"
              />
              <svg
                className="absolute left-3 top-3 w-4 h-4 text-tm-forest-700/60 dark:text-tm-parchment/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button type="submit" variant="primary">Search</Button>
          </form>

          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-tm-forest-700/70 dark:text-tm-parchment/60 mr-2">
              Subject:
            </span>
            {SUBJECT_OPTIONS.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedSubject === sub
                    ? 'bg-tm-forest-800 text-tm-parchment dark:bg-tm-parchment dark:text-tm-forest-900 shadow-sm'
                    : 'bg-tm-forest-800/5 dark:bg-tm-parchment/10 text-tm-forest-800 dark:text-tm-parchment hover:bg-tm-forest-800/10'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Grade Level Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-tm-forest-700/70 dark:text-tm-parchment/60 mr-2">
              Grade:
            </span>
            {GRADE_OPTIONS.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedGrade === grade
                    ? 'bg-tm-terracotta text-tm-parchment shadow-sm'
                    : 'bg-tm-forest-800/5 dark:bg-tm-parchment/10 text-tm-forest-800 dark:text-tm-parchment hover:bg-tm-forest-800/10'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert type="error" title="Catalog Error">
            {error}
          </Alert>
        )}

        {/* Lesson Catalog Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lessons.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-tm-sage/10 rounded-full flex items-center justify-center text-tm-forest-800 dark:text-tm-sage">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
              No lessons match your criteria
            </h3>
            <p className="text-sm text-tm-forest-700/80 dark:text-tm-parchment/70 max-w-sm mx-auto">
              Try adjusting your search query, or clear filters to browse all verified teaching content.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSubject('All');
                setSelectedGrade('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="p-5 flex flex-col justify-between hover:border-tm-terracotta/40 transition-all hover:shadow-md cursor-pointer group"
                onClick={() => navigate(`/student/lessons/${lesson.id}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-tm-sage/20 text-tm-forest-800 dark:text-tm-sage">
                      {lesson.subject}
                    </span>
                    <span className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/60 font-mono">
                      {lesson.grade_level}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-semibold text-tm-forest-900 dark:text-tm-parchment group-hover:text-tm-terracotta transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-tm-forest-700/80 dark:text-tm-parchment/70 mt-1 line-clamp-2">
                      Topic: {lesson.topic}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-tm-forest-800/10 dark:border-tm-parchment/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-tm-forest-700/70 dark:text-tm-parchment/60">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-tm-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {lesson.card_count} micro-cards
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-tm-honey" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ~{lesson.duration_minutes} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/50">
                      By {lesson.teacher_name}
                    </span>
                    <Button variant="primary" size="sm">
                      Start Lesson →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
