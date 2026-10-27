import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/ProgressBar';
import { User, Mail, Lock, GraduationCap, Users } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await register({
        display_name: displayName,
        email,
        password,
        role,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      });
      if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/lessons');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8 pb-16 px-4">
      <Card className="p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-structure-light dark:text-structure-dark">
            Join TeachMate
          </h1>
          <p className="text-sm text-slate-muted dark:text-slate-darkMuted mt-1">
            Create an account to start preparing or learning
          </p>
        </div>

        {errorMsg && (
          <Alert type="error" className="mb-6">
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-card">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                  role === 'teacher'
                    ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25] shadow-subtle'
                    : 'text-slate-reading dark:text-structure-dark hover:bg-[#E2DEC9] dark:hover:bg-[#2C3F36]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                  role === 'student'
                    ? 'bg-structure-light text-[#F5F3ED] dark:bg-accent-dark dark:text-[#192A25] shadow-subtle'
                    : 'text-slate-reading dark:text-structure-dark hover:bg-[#E2DEC9] dark:hover:bg-[#2C3F36]'
                }`}
              >
                <Users className="w-4 h-4" />
                Student
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Prof. Maria Sharma"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="regEmail"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="regEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@university.edu"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="regPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
            >
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="regPassword"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-2 font-semibold">
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-muted dark:text-slate-darkMuted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent dark:text-accent-dark hover:underline">
            Sign in here
          </Link>
        </div>
      </Card>
    </div>
  );
};
