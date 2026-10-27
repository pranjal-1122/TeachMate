import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';
import {
  BookOpen, PlusCircle, LayoutDashboard, Award,
  Compass, User as UserIcon, Sun, Moon, LogOut, Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isTeacher, isStudent, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#F5F3ED]/95 dark:bg-[#192A25]/95 backdrop-blur-sm border-b border-line-light dark:border-line-dark transition-colors">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-[#192A25] focus:font-bold focus:rounded-card"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group focus-visible:outline-accent">
              <div className="w-9 h-9 rounded-lg bg-structure-light dark:bg-accent-dark flex items-center justify-center text-[#F5F3ED] dark:text-[#192A25] font-bold shadow-subtle group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-structure-light dark:text-structure-dark block leading-none">
                  TeachMate
                </span>
                <span className="text-[10px] text-slate-muted dark:text-slate-darkMuted uppercase tracking-wider font-semibold">
                  Agentic AI
                </span>
              </div>
            </Link>

            {/* Role indicator pill */}
            {user && (
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-light dark:bg-surface-dark text-slate-reading dark:text-structure-dark border border-line-light dark:border-line-dark">
                {isTeacher ? 'Teacher Mode' : 'Student Mode'}
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            {isTeacher && (
              <>
                <Link
                  to="/teacher/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-sm font-medium transition-colors ${
                    isActive('/teacher/dashboard')
                      ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25]'
                      : 'text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/teacher/new"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-sm font-medium transition-colors ${
                    isActive('/teacher/new')
                      ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25]'
                      : 'text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Session
                </Link>
              </>
            )}

            {isStudent && (
              <>
                <Link
                  to="/student/progress"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-sm font-medium transition-colors ${
                    isActive('/student/progress')
                      ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25]'
                      : 'text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Progress
                </Link>
                <Link
                  to="/student/badges"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-sm font-medium transition-colors ${
                    isActive('/student/badges')
                      ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25]'
                      : 'text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Badges
                </Link>
              </>
            )}

            {/* Catalog link is visible to everyone */}
            <Link
              to="/lessons"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-card text-sm font-medium transition-colors ${
                isActive('/lessons')
                  ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25]'
                  : 'text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore Lessons
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-card text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark border border-line-light dark:border-line-dark transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-accent-dark" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  aria-label="Account Settings"
                  className="p-2 rounded-card text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark border border-line-light dark:border-line-dark transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-structure-light dark:text-structure-dark leading-tight">
                    {user.display_name}
                  </span>
                  <span className="text-[10px] text-slate-muted dark:text-slate-darkMuted leading-tight">
                    {user.email}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="p-2"
                >
                  <LogOut className="w-4 h-4 text-state-danger" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
