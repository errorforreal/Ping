import { useState } from 'react';
import './Layout.css';

interface NavbarProps {
  onLogout: () => Promise<void>;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    await onLogout();
    // No need to set isLoggingOut(false) since the component unmounts upon redirection
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Can put breadcrumbs or page title here eventually */}
      </div>
      
      <div className="navbar-right">
        <div className="tenant-badge">
          <div className="tenant-status"></div>
          <span className="text-mono">Tenant Connected</span>
        </div>
        
        <button onClick={() => document.body.classList.toggle('light-theme')} className="nav-action" title="Toggle Theme" disabled={isLoggingOut}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <button onClick={handleLogoutClick} className="nav-action" title="Sign Out" disabled={isLoggingOut}>
          {isLoggingOut ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeOpacity="0.3" />
              <path d="M12 2v4" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
