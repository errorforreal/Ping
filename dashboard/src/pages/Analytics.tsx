import './Analytics.css';

// Mock data for Commit 7 UI scaffolding
const MOCK_STATS = {
  total: "14,203",
  successRate: "99.8%",
  failed: "28"
};

const MOCK_DELIVERIES = [
  { id: "notif_1a2b3c4d", channel: "EMAIL", status: "SENT", timestamp: "2 mins ago", recipient: "test@example.com" },
  { id: "notif_5e6f7g8h", channel: "SMS", status: "PENDING", timestamp: "5 mins ago", recipient: "+19876543210" },
  { id: "notif_9i0j1k2l", channel: "EMAIL", status: "FAILED", timestamp: "1 hour ago", recipient: "bounced@domain.com" },
  { id: "notif_3m4n5o6p", channel: "SMS", status: "SENT", timestamp: "2 hours ago", recipient: "+12345678900" },
];

export default function Analytics() {
  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'SENT': return 'badge-sent';
      case 'PENDING': return 'badge-pending';
      case 'FAILED': return 'badge-failed';
      default: return '';
    }
  };

  return (
    <div className="analytics-container">
      
      <div className="page-header">
        <h1 className="page-title">Analytics Overview</h1>
        <p className="page-subtitle">Monitor your messaging delivery performance in real-time.</p>
      </div>

      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Total Sent
          </div>
          <div className="stat-value text-gradient">{MOCK_STATS.total}</div>
          <div className="stat-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            +12.5% from last week
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Success Rate
          </div>
          <div className="stat-value" style={{ color: '#4ade80' }}>{MOCK_STATS.successRate}</div>
          <div className="stat-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            +0.1% from last week
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Failed Deliveries
          </div>
          <div className="stat-value" style={{ color: '#f87171' }}>{MOCK_STATS.failed}</div>
          <div className="stat-trend trend-down">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            -5 this week
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="table-header">
          <h2 className="table-title">Recent Deliveries</h2>
          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
            Refresh Data
          </button>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Notification ID</th>
                <th>Recipient</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DELIVERIES.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="text-mono" style={{ color: 'var(--text-secondary)' }}>{delivery.id}</td>
                  <td className="text-mono" style={{ fontSize: '0.85rem' }}>{delivery.recipient}</td>
                  <td>
                    <span className="channel-tag">{delivery.channel}</span>
                  </td>
                  <td>
                    <span className={`badge ${getBadgeClass(delivery.status)}`}>
                      <span className="badge-dot"></span>
                      {delivery.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{delivery.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
