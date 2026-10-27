import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { NewSessionPage } from './pages/teacher/NewSessionPage';
import { AssessmentPage } from './pages/teacher/AssessmentPage';
import { AnalysisPage } from './pages/teacher/AnalysisPage';
import { RevisionPage } from './pages/teacher/RevisionPage';
import { LessonEditorPage } from './pages/teacher/LessonEditorPage';

// Student Pages
import { ExplorePage } from './pages/student/ExplorePage';
import { StudentLessonPage } from './pages/student/StudentLessonPage';
import { StudentQuizPage } from './pages/student/StudentQuizPage';
import { StudentProgressPage } from './pages/student/StudentProgressPage';
import { StudentBadgesPage } from './pages/student/StudentBadgesPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('teacher' | 'student')[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tm-parchment dark:bg-tm-forest-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-tm-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default home for their role
    if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else {
      return <Navigate to="/explore" replace />;
    }
  }

  return <>{children}</>;
};

// Layout with Navbar
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-tm-parchment dark:bg-tm-forest-900 text-tm-forest-900 dark:text-tm-parchment">
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/lessons" element={<ExplorePage />} />

              {/* Student Routes */}
              <Route
                path="/student/lessons/:id"
                element={
                  <ProtectedRoute>
                    <StudentLessonPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:id"
                element={
                  <ProtectedRoute>
                    <StudentLessonPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/lessons/:id/quiz"
                element={
                  <ProtectedRoute>
                    <StudentQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:id/quiz"
                element={
                  <ProtectedRoute>
                    <StudentQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/progress"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentProgressPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/badges"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentBadgesPage />
                  </ProtectedRoute>
                }
              />

              {/* Teacher Routes */}
              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/new"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <NewSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/new"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <NewSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/:id/assessment"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <AssessmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/:id/analysis"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <AnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/:id/revision"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <RevisionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/:id/lesson"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <LessonEditorPage />
                  </ProtectedRoute>
                }
              />

              {/* Common Authenticated Routes */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 / Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
