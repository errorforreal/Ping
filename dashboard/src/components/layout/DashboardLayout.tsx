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
      
      <main className="main-content">
        <Navbar onLogout={onLogout} />
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
