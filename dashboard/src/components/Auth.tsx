import { useState } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (token: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const url = isLogin ? '/api/tenant/login' : '/api/tenant/signup';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        // Backend currently returns { message: "token" }
        onLogin(data.message);
      } else {
        // Backend returns { message: "Tenant created successfully", apiKey: "..." }
        setNewApiKey(data.apiKey);
        setFormData({ ...formData, password: '' }); // Clear password for security
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card animate-float" style={{ animationDuration: '6s' }}>
        
        <div className="auth-header">
          <h1 className="auth-title text-gradient">Ping</h1>
          <p className="auth-subtitle text-mono">
            {isLogin ? 'Authenticate to access the dashboard' : 'Initialize a new tenant workspace'}
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid var(--accent-error)', padding: '0.5rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="name">Tenant Name</label>
              <input 
                type="text" 
                id="name" 
                className="auth-input" 
                placeholder="Acme Corp" 
                required 
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              className="auth-input text-mono" 
              placeholder="developer@acme.com" 
              required 
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="auth-input text-mono" 
              placeholder="••••••••••••" 
              required 
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : (isLogin ? 'Sign In' : 'Create Tenant')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button type="button" onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
        
      </div>

      {newApiKey && (
        <div className="toast-overlay">
          <div className="toast-modal glass-panel">
            <h2 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Tenant Created!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Your workspace is ready. Please save your API key now. For security reasons, it will never be shown again.
            </p>
            <div className="text-mono" style={{ background: '#09090b', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)', color: 'var(--accent-primary)', wordBreak: 'break-all', marginBottom: '2rem', fontSize: '0.9rem' }}>
              {newApiKey}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                className="btn-primary" 
                style={{ flex: 1, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                onClick={(e) => {
                  navigator.clipboard.writeText(newApiKey);
                  const btn = e.currentTarget;
                  btn.textContent = 'Copied!';
                  setTimeout(() => btn.textContent = 'Copy API Key', 2000);
                }}
              >
                Copy API Key
              </button>
              <button 
                type="button"
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setNewApiKey(null);
                  setIsLogin(true);
                }}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
