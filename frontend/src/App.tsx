import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { AuthProvider, useAuth } from './auth';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Historique from './pages/Historique';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import DashboardInspiration from './pages/DashboardInspiration';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      {isAuthenticated && <Navigation />}
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />} />
          <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
          <Route path="/historique" element={isAuthenticated ? <Historique /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/test-dashboard" element={<DashboardInspiration />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <Theme>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Theme>
  );
}

export default App;
