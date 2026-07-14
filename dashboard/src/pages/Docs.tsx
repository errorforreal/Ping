import { useState } from 'react';

export default function Docs() {
  const [activeTab, setActiveTab] = useState('curl');

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

        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem', marginTop: '1.5rem' }}>Headers</h4>
        <div style={{ marginBottom: '1.5rem', background: '#09090b', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 500 }}>Header</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 500 }}>Value</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 500 }}>Required</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: '#93c5fd', fontFamily: 'monospace' }}>Content-Type</td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: '#fff', fontFamily: 'monospace' }}>application/json</td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', color: '#a1a1aa' }}>Yes</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 1rem', color: '#93c5fd', fontFamily: 'monospace' }}>ping-api-key</td>
                <td style={{ padding: '0.75rem 1rem', color: '#fff', fontFamily: 'monospace' }}>your_raw_api_key</td>
                <td style={{ padding: '0.75rem 1rem', color: '#a1a1aa' }}>Yes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Payload (JSON)</h4>
        <pre style={{ background: '#09090b', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)', overflowX: 'auto', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', marginBottom: '2.5rem' }}>
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

        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Code Examples</h3>
        <div style={{ background: '#09090b', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
            <button 
              onClick={() => setActiveTab('curl')}
              style={{ padding: '0.75rem 1.25rem', background: activeTab === 'curl' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderRight: '1px solid var(--border-light)', color: activeTab === 'curl' ? '#fff' : 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease', borderBottom: activeTab === 'curl' ? '2px solid #93c5fd' : '2px solid transparent', outline: 'none' }}
            >
              cURL
            </button>
            <button 
              onClick={() => setActiveTab('node')}
              style={{ padding: '0.75rem 1.25rem', background: activeTab === 'node' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'node' ? '#fff' : 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease', borderBottom: activeTab === 'node' ? '2px solid #93c5fd' : '2px solid transparent', outline: 'none' }}
            >
              Node.js
            </button>
          </div>
          
          <div style={{ padding: '1.25rem' }}>
            {activeTab === 'curl' && (
              <pre style={{ overflowX: 'auto', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', margin: 0 }}>
                <code>
{`curl -X POST http://localhost:8000/api/notify/v1 \\
  -H "Content-Type: application/json" \\
  -H "ping-api-key: your_raw_api_key" \\
  -d '{
    "user": {
      "id": "user_123",
      "email": "customer@example.com"
    },
    "notification": {
      "type": "ALERT",
      "title": "Welcome",
      "message": "Hello from Ping"
    },
    "channels": ["EMAIL"]
  }'`}
                </code>
              </pre>
            )}
            
            {activeTab === 'node' && (
              <pre style={{ overflowX: 'auto', fontSize: '0.85rem', color: '#abb2bf', lineHeight: '1.6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', margin: 0 }}>
                <code dangerouslySetInnerHTML={{ __html: `<span style="color: #c678dd">const</span> <span style="color: #e5c07b">response</span> = <span style="color: #c678dd">await</span> <span style="color: #61afef">fetch</span>(<span style="color: #98c379">'http://localhost:8000/api/notify/v1'</span>, {
  <span style="color: #e06c75">method</span>: <span style="color: #98c379">'POST'</span>,
  <span style="color: #e06c75">headers</span>: {
    <span style="color: #98c379">'Content-Type'</span>: <span style="color: #98c379">'application/json'</span>,
    <span style="color: #98c379">'ping-api-key'</span>: <span style="color: #98c379">'your_raw_api_key'</span>
  },
  <span style="color: #e06c75">body</span>: <span style="color: #e5c07b">JSON</span>.<span style="color: #61afef">stringify</span>({
    <span style="color: #e06c75">user</span>: {
      <span style="color: #e06c75">id</span>: <span style="color: #98c379">'user_123'</span>,
      <span style="color: #e06c75">email</span>: <span style="color: #98c379">'customer@example.com'</span>
    },
    <span style="color: #e06c75">notification</span>: {
      <span style="color: #e06c75">type</span>: <span style="color: #98c379">'ALERT'</span>,
      <span style="color: #e06c75">title</span>: <span style="color: #98c379">'Welcome'</span>,
      <span style="color: #e06c75">message</span>: <span style="color: #98c379">'Hello from Ping'</span>
    },
    <span style="color: #e06c75">channels</span>: [<span style="color: #98c379">'EMAIL'</span>]
  })
});

<span style="color: #c678dd">const</span> <span style="color: #e5c07b">data</span> = <span style="color: #c678dd">await</span> <span style="color: #e5c07b">response</span>.<span style="color: #61afef">json</span>();
<span style="color: #e5c07b">console</span>.<span style="color: #61afef">log</span>(data);` }} />
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
