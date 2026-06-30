import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/Auth'
import DashboardLayout from './components/layout/DashboardLayout'

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

  if (!token) {
    return <Auth onLogin={handleLogin} />
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      {/* Temporary Placeholder Content for Commit 5 */}
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Dashboard Scaffold Complete</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          The responsive Sidebar and Top Navbar layout has been successfully implemented.
        </p>
        <div style={{ display: 'inline-block', textAlign: 'left' }}>
          <p className="text-mono" style={{ 
            background: 'var(--bg-primary)', 
            padding: '1.5rem', 
            borderRadius: '6px', 
            border: '1px solid var(--border-light)',
            color: 'var(--accent-primary)',
            fontSize: '0.9rem',
            wordBreak: 'break-all',
            maxWidth: '600px'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>// Active JWT Token</span><br/><br/>
            {token}
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default App
