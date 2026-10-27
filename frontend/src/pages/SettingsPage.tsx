import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-tm-forest-800/10 dark:border-tm-parchment/10 pb-6">
          <h1 className="text-3xl font-display font-semibold text-tm-forest-900 dark:text-tm-parchment tracking-tight">
            Account & Preferences
          </h1>
          <p className="mt-1 text-sm text-tm-forest-700/80 dark:text-tm-parchment/70">
            Manage your appearance preferences, view account credentials, and explore navigation shortcuts.
          </p>
        </div>

        {/* Profile Card */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Full Name
              </p>
              <p className="font-medium text-tm-forest-900 dark:text-tm-parchment mt-0.5">
                {user?.display_name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Email Address
              </p>
              <p className="font-medium text-tm-forest-900 dark:text-tm-parchment mt-0.5">
                {user?.email || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Role
              </p>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-tm-terracotta/10 text-tm-terracotta capitalize">
                {user?.role || 'Guest'}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-tm-forest-700/70 dark:text-tm-parchment/60">
                Account Status
              </p>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Active & Verified
              </span>
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
            Theme & Appearance
          </h2>
          <p className="text-xs text-tm-forest-700/80 dark:text-tm-parchment/70">
            Choose your preferred color theme. Light uses our warm parchment palette, while dark features our high-contrast deep forest theme.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { id: 'light', label: 'Light', desc: 'Parchment & Forest' },
              { id: 'dark', label: 'Dark', desc: 'Deep Forest & Honey' },
              { id: 'system', label: 'System', desc: 'Match OS setting' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id as any)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  theme === mode.id
                    ? 'border-tm-terracotta bg-tm-terracotta/5 ring-2 ring-tm-terracotta text-tm-forest-900 dark:text-tm-parchment'
                    : 'border-tm-forest-800/15 dark:border-tm-parchment/15 hover:border-tm-forest-800/30 text-tm-forest-800 dark:text-tm-parchment/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{mode.label}</span>
                  {theme === mode.id && <span className="text-tm-terracotta text-sm">✓</span>}
                </div>
                <span className="text-[11px] opacity-70 block">{mode.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Keyboard Shortcuts Cheatsheet */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-tm-forest-900 dark:text-tm-parchment">
            Keyboard Navigation Cheatsheet
          </h2>
          <p className="text-xs text-tm-forest-700/80 dark:text-tm-parchment/70">
            Speed up your micro-learning experience with native keyboard shortcuts during lesson viewing:
          </p>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-tm-forest-800/5 dark:bg-tm-parchment/5">
              <span className="text-tm-forest-800 dark:text-tm-parchment">Next micro-card</span>
              <kbd className="px-2 py-1 rounded bg-tm-forest-800/10 dark:bg-tm-parchment/10 font-mono text-[11px]">
                ↓ or j
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-tm-forest-800/5 dark:bg-tm-parchment/5">
              <span className="text-tm-forest-800 dark:text-tm-parchment">Previous micro-card</span>
              <kbd className="px-2 py-1 rounded bg-tm-forest-800/10 dark:bg-tm-parchment/10 font-mono text-[11px]">
                ↑ or k
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-tm-forest-800/5 dark:bg-tm-parchment/5">
              <span className="text-tm-forest-800 dark:text-tm-parchment">Mark active card complete</span>
              <kbd className="px-2 py-1 rounded bg-tm-forest-800/10 dark:bg-tm-parchment/10 font-mono text-[11px]">
                Enter / Click
              </kbd>
            </div>
          </div>
        </Card>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-tm-forest-800/10 dark:border-tm-parchment/10 flex justify-between items-center">
          <span className="text-xs text-tm-forest-700/60 dark:text-tm-parchment/50">
            TeachMate v1.0 • Agentic AI Teaching Preparation System
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
