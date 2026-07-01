export default function Docs() {
  return (
    <div className="glass-panel" style={{ padding: '2.5rem', marginTop: '2rem', animation: 'fadeIn 0.3s ease-out', maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>API Documentation</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Send notifications through the unified Ping API.</p>

      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Send a Notification</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          <span style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>POST</span>
          <code style={{ color: 'var(--text-primary)' }}>/api/notify/v1</code>
        </p>

        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Headers</h4>
        <pre style={{ background: '#09090b', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)', overflowX: 'auto', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <code style={{ color: '#fff' }}>
<span style={{ color: '#93c5fd' }}>"Content-Type"</span>: "application/json"
<span style={{ color: '#93c5fd' }}>"ping-api-key"</span>: "your_raw_api_key"
<span style={{ color: '#93c5fd' }}>"x-tenant-id"</span>: "your_tenant_id"
          </code>
        </pre>

        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Payload (JSON)</h4>
        <pre style={{ background: '#09090b', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)', overflowX: 'auto', fontSize: '0.85rem', color: '#e2e8f0' }}>
          <code>
{`{
  "user": {
    "id": "user_123",
    "email": "customer@example.com",
    "phone": "+1234567890"
  },
  "notification": {
    "type": "ALERT",
    "title": "Welcome",
    "message": "Hello from Ping"
  },
  "channels": ["EMAIL", "SMS"] // 1 or more channels
}`}
          </code>
        </pre>
      </div>
    </div>
  );
}
