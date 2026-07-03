import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

interface DashboardLayoutProps {
  onLogout: () => Promise<void>;
}

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content" style={{ flex: 1, minWidth: 'calc(100vw - 260px)', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%' }}>
          <Navbar onLogout={onLogout} />
        </div>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
