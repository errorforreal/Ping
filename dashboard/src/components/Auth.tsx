import { useState } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (token: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);

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
        setSuccess(`Tenant created! Save this API Key: ${data.apiKey}`);
        setIsLogin(true); // Switch to login screen
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

        {success && (
          <div style={{ color: 'var(--accent-success)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid var(--accent-success)', padding: '0.5rem', borderRadius: '4px' }}>
            {success}
            <br/><br/>
            Please sign in below.
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
          {isLogin ? "Don't have an account?" : "Already have a tenant?"}
          <button type="button" onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setSuccess(null);
          }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
