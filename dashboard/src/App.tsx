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

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('ping_token');
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
