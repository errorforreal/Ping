import { useState } from 'react';
import '../components/Auth.css';

export default function ApiKeys() {
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tenant/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to regenerate key');
      setNewApiKey(data.apiKey);
      setShowRotateModal(false);
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>API Credentials</h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Your raw API Key was generated and shown to you exactly once during signup. For security reasons, we only store a cryptographic hash of it and cannot display it again.
          </p>
        </div>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Danger Zone</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            If your API key is compromised or lost, you can regenerate it here. This will immediately invalidate your old key.
          </p>
          <button 
            onClick={() => setShowRotateModal(true)} 
            className="btn-primary" 
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            Regenerate API Key
          </button>
        </div>
      </div>

      {showRotateModal && (
        <div className="toast-overlay" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="toast-modal glass-panel">
            <h2 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Regenerate API Key</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Please enter your credentials to verify your identity.
            </p>
            {error && (
              <div style={{ color: 'var(--accent-error)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.5rem', border: '1px solid var(--accent-error)', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleRotate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <input 
                type="password" 
                placeholder="Password" 
                className="auth-input text-mono" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                maxLength={128}
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="auth-button" disabled={isLoading} style={{ flex: 1 }}>
                  {isLoading ? 'Verifying...' : 'Regenerate'}
                </button>
                <button 
                  type="button" 
                  className="auth-button" 
                  onClick={() => setShowRotateModal(false)} 
                  style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newApiKey && (
        <div className="toast-overlay" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="toast-modal glass-panel">
            <h2 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Key Regenerated!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Your old API key has been invalidated. Please save your new API key now. For security reasons, it will never be shown again.
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
                onClick={() => setNewApiKey(null)}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
