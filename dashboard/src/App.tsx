import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Auth from './components/Auth'
import DashboardLayout from './components/layout/DashboardLayout'
import Analytics from './pages/Analytics';
import ApiKeys from './pages/ApiKeys';
import Docs from './pages/Docs';

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/tenant/session', { credentials: 'include' })
      .then(response => setAuthenticated(response.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogin = () => setAuthenticated(true);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/tenant/logout', { method: 'POST', credentials: 'include' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn(`Server logout returned ${response.status}:`, data.message);
      }
    } catch (e) {
      console.error("Network error during server logout:", e);
    } finally {
      setAuthenticated(false);
    }
  };

  if (authenticated === null) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Route */}
        <Route 
          path="/auth" 
          element={!authenticated ? <Auth onLogin={handleLogin} /> : <Navigate to="/" replace />}
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/" 
          element={authenticated ? <DashboardLayout onLogout={handleLogout} /> : <Navigate to="/auth" replace />}
        >
          <Route index element={<Analytics />} />
          <Route path="keys" element={<ApiKeys />} />
          <Route path="docs" element={<Docs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
