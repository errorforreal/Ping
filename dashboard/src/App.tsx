import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/Auth'

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

  // Placeholder for Phase 3 (Dashboard Skeleton)
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.5rem' }}>Ping Dashboard</h1>
        <button onClick={handleLogout} className="btn-primary" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
          Sign Out
        </button>
      </header>
      
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '10vh' }}>
        <h2 style={{ marginBottom: '1rem' }}>Welcome to the Developer Portal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Your JWT token is securely stored in localStorage.
        </p>
        <p className="text-mono" style={{ 
          background: 'rgba(0,0,0,0.5)', 
          padding: '1rem', 
          borderRadius: '4px', 
          wordBreak: 'break-all',
          color: 'var(--accent-primary)',
          fontSize: '0.8rem'
        }}>
          {token}
        </p>
      </div>
    </div>
  )
}

export default App
