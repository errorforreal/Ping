import { useState, useEffect } from 'react';
import './Analytics.css';

interface Delivery {
  id: string;
  channel: string;
  status: string;
  timestamp: string;
  recipient: string;
}

interface Stats {
  total: string;
  successRate: string;
  failed: string;
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats>({ total: "0", successRate: "0%", failed: "0" });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('ping_token');
      const res = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('ping_token');
        window.location.href = '/auth';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      
      const data = await res.json();
      setStats(data.stats);
      setDeliveries(data.deliveries);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'SENT': return 'badge-sent';
      case 'PENDING': return 'badge-pending';
      case 'FAILED': return 'badge-failed';
      default: return '';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="analytics-container">
      
      <div className="page-header">
        <h1 className="page-title">Analytics Overview</h1>
        <p className="page-subtitle">Monitor your messaging delivery performance in real-time.</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-error)', border: '1px solid var(--accent-error)', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Total Sent
          </div>
          <div className="stat-value text-gradient">
            {isLoading ? '...' : stats.total}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Success Rate
          </div>
          <div className="stat-value" style={{ color: '#4ade80' }}>
            {isLoading ? '...' : stats.successRate}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Failed Deliveries
          </div>
          <div className="stat-value" style={{ color: '#f87171' }}>
            {isLoading ? '...' : stats.failed}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="table-header">
          <h2 className="table-title">Recent Deliveries</h2>
          <button onClick={fetchAnalytics} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
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
              {isLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td></tr>
              ) : deliveries.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No notifications sent yet.</td></tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="text-mono" style={{ color: 'var(--text-secondary)' }}>{delivery.id.split('-')[0]}</td>
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
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatTime(delivery.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
