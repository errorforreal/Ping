import { useState } from 'react';

export default function ApiKeys() {
  const token = localStorage.getItem('ping_token');
  // ponytail: natively decode JWT payload to get Tenant ID without a backend roundtrip
  const tenantId = token ? JSON.parse(atob(token.split('.')[1])).id : 'Unknown';
  
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(tenantId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>API Credentials</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Tenant ID</label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <code className="text-mono" style={{ background: '#09090b', padding: '0.75rem 1rem', borderRadius: '4px', flex: 1, border: '1px solid var(--border-light)', color: 'var(--accent-primary)' }}>
            {tenantId}
          </code>
          <button onClick={handleCopy} className="btn-primary" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', minWidth: '100px' }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your unique workspace identifier.</p>
      </div>

      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>ping-api-key</label>
        <div style={{ padding: '1rem', background: 'rgba(255,172,90,0.1)', border: '1px solid rgba(255,172,90,0.3)', borderRadius: '4px', color: '#ffb476', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Your raw API Key was generated and shown to you exactly once during signup. For security reasons, we only store a cryptographic hash of it and cannot display it again. 
          <br/><br/>
          <em>(Key rotation is intentionally omitted for now. Add POST /api/tenant/rotate when a user actually loses their key.)</em>
        </div>
      </div>
    </div>
  );
}
