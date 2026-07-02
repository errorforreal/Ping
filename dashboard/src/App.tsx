import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Auth from './components/Auth'
import DashboardLayout from './components/layout/DashboardLayout'
import Analytics from './pages/Analytics';
import ApiKeys from './pages/ApiKeys';
import Docs from './pages/Docs';

function App() {
  // Initialize token synchronously to prevent redirect flashes on page reload
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ping_token'));

  // Optional: Listen for cross-tab token changes
  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('ping_token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('ping_token', newToken);
  };

  const handleLogout = async () => {
    if (!token) {
      setToken(null);
      localStorage.removeItem('ping_token');
      return;
    }

    try {
      const [response] = await Promise.all([
        fetch('/api/tenant/logout', { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        new Promise(resolve => setTimeout(resolve, 800)) // Artificial delay for UX spinner
      ]);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn(`Server logout returned ${response.status}:`, data.message);
      }
    } catch (e) {
      console.error("Network error during server logout:", e);
    } finally {
      // Always clear local session to ensure the user isn't trapped logged in
      setToken(null);
      localStorage.removeItem('ping_token');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Route */}
        <Route 
          path="/auth" 
          element={!token ? <Auth onLogin={handleLogin} /> : <Navigate to="/" replace />} 
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/" 
          element={token ? <DashboardLayout onLogout={handleLogout} /> : <Navigate to="/auth" replace />}
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
