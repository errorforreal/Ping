import { useState } from 'react';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fake loading state for UI demonstration (Commit 3 requirement)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
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
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : (isLogin ? 'Sign In' : 'Create Tenant')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have a tenant?"}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
