import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Auth from './components/Auth'
import DashboardLayout from './components/layout/DashboardLayout'
import Analytics from './pages/Analytics';
import ApiKeys from './pages/ApiKeys';
import Docs from './pages/Docs';

function App() {
  const [token, setToken] = useState<string | null>(null);

  // Check local storage for existing token on load
  useEffect(() => {
    const savedToken = localStorage.getItem('ping_token');
    if (savedToken) {
      setToken(savedToken);
    }
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
