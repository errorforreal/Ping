import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  // Temporary state until Commit 6 sets up React Router
  const [activePath, setActivePath] = useState('analytics');

  return (
    <div className="dashboard-container">
      <Sidebar activePath={activePath} setActivePath={setActivePath} />
      
      <main className="main-content">
        <Navbar onLogout={onLogout} />
        
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
