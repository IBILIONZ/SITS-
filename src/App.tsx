import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Results from './pages/Results';
import Transcript from './pages/Transcript';
import Lecturers from './pages/Lecturers';
import Enrollments from './pages/Enrollments';
import Departments from './pages/Departments';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import { seedDatabase } from './lib/seed';
import { getDocFromServer, doc } from 'firebase/firestore';
import { db } from './firebase';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { user, loading, isAuthReady } = useFirebase();

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c3e50]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { isAuthReady } = useFirebase();

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    if (isAuthReady) {
      testConnection();
      seedDatabase();
    }
  }, [isAuthReady]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/students" element={
        <ProtectedRoute roles={['admin']}>
          <Students />
        </ProtectedRoute>
      } />

      <Route path="/lecturers" element={
        <ProtectedRoute roles={['admin']}>
          <Lecturers />
        </ProtectedRoute>
      } />

      <Route path="/enrollments" element={
        <ProtectedRoute roles={['admin']}>
          <Enrollments />
        </ProtectedRoute>
      } />

      <Route path="/departments" element={
        <ProtectedRoute roles={['admin']}>
          <Departments />
        </ProtectedRoute>
      } />

      <Route path="/sessions" element={
        <ProtectedRoute roles={['admin']}>
          <Sessions />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute roles={['admin', 'lecturer', 'student']}>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/courses" element={
        <ProtectedRoute roles={['admin']}>
          <Courses />
        </ProtectedRoute>
      } />

      <Route path="/attendance" element={
        <ProtectedRoute roles={['admin', 'lecturer']}>
          <Attendance />
        </ProtectedRoute>
      } />

      <Route path="/results" element={
        <ProtectedRoute roles={['admin', 'lecturer']}>
          <Results />
        </ProtectedRoute>
      } />

      <Route path="/transcript" element={
        <ProtectedRoute roles={['admin', 'student']}>
          <Transcript />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider>
        <AppRoutes />
      </FirebaseProvider>
    </BrowserRouter>
  );
}
