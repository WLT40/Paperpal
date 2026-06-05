import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { api } from './api/client';
import LoginPage from './components/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const token = api.getToken();
    if (token) {
      // Validate token
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data))
        .catch(() => api.clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Listen for auth errors from API client
    const handler = () => setUser(null);
    window.addEventListener('paperpal-auth-error', handler);
    return () => window.removeEventListener('paperpal-auth-error', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Routes>
      <Route path="/*" element={<AppLayout user={user} onLogout={() => { api.clearToken(); setUser(null); }} />} />
    </Routes>
  );
}

export default App;
