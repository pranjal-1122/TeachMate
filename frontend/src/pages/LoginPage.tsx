import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/ProgressBar';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/lessons');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-10 pb-16 px-4">
      <Card className="p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-structure-light dark:text-structure-dark">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-muted dark:text-slate-darkMuted mt-1">
            Sign in to access your sessions and lessons
          </p>
        </div>

        {errorMsg && (
          <Alert type="error" className="mb-6">
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-reading dark:text-structure-dark mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm rounded-card bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark text-slate-reading dark:text-structure-dark focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-slate-reading"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-2 font-semibold">
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-slate-muted dark:text-slate-darkMuted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-accent dark:text-accent-dark hover:underline">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
};
