import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';

const DEFAULT_USER = { username: '123', password: '123' };

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authApi = useMemo(
    () => ({
      login: ({ username, password }) => {
        const valid = username === DEFAULT_USER.username && password === DEFAULT_USER.password;
        setIsAuthenticated(valid);
        return valid;
      },
      logout: () => setIsAuthenticated(false),
    }),
    [],
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={authApi.login} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <DashboardPage onLogout={authApi.logout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}
