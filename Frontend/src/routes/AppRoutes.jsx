import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';

import Home from '../pages/Home';
import About from '../pages/About';
import Contact from '../pages/Contact';
import NotFound from '../pages/NotFound';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

import StudentDashboard from '../pages/student/Dashboard';
import StudentProfile from '../pages/student/Profile';
import StudentJobSearch from '../pages/student/JobSearch';
import StudentAppliedJobs from '../pages/student/AppliedJobs';
import Chat from '../pages/chat/Chat';
import StudentSavedJobs from '../pages/student/SavedJobs';
import JobseekerManageProfile from '../pages/jobseeker/ManageProfile';

import RecruiterDashboard from '../pages/recruiter/Dashboard';
import RecruiterPostJob from '../pages/recruiter/PostJob';
import RecruiterManageJobs from '../pages/recruiter/ManageJobs';
import RecruiterApplicants from '../pages/recruiter/Applicants';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getDefaultRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'jobseeker':
        return '/jobseeker/dashboard';
      case 'recruiter':
        return '/recruiter/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <>
      {!['/login', '/register'].includes(location.pathname) && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to={getDefaultRoute()} replace /> : <Home />}
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/login"
          element={user ? <Navigate to={getDefaultRoute()} replace /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/register"
          element={user ? <Navigate to={getDefaultRoute()} replace /> : <Register />}
        />

        <Route
          path="/jobseeker/dashboard"
          element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobseeker/profile"
          element={
            <Navigate to="/jobseeker/manage-profile" replace />
          }
        />
        <Route
          path="/jobseeker/manage-profile"
          element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <JobseekerManageProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobseeker/jobs"
          element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <StudentJobSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobseeker/applied"
          element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <StudentAppliedJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute allowedRoles={['jobseeker', 'recruiter']}>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobseeker/saved"
          element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <StudentSavedJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/post-job"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterPostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterManageJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applicants/:jobId"
          element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <RecruiterApplicants />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
