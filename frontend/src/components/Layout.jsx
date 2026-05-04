import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, AlertCircle, LogOut, FilePlus, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
          SC
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>SmartGov</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Coordination Portal</span>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link to="/dashboard" style={{ 
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
          background: location.pathname.startsWith('/dashboard') ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
          color: location.pathname.startsWith('/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
          fontWeight: location.pathname.startsWith('/dashboard') ? 600 : 400,
          transition: 'all 0.2s'
        }}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link to="/issues" style={{ 
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
          background: location.pathname.startsWith('/issues') ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
          color: location.pathname.startsWith('/issues') ? 'var(--primary)' : 'var(--text-secondary)',
          fontWeight: location.pathname.startsWith('/issues') ? 600 : 400,
          transition: 'all 0.2s'
        }}>
          <AlertCircle size={20} />
          Issues
        </Link>
        <Link to="/complaints" style={{ 
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
          background: location.pathname.startsWith('/complaints') ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
          color: location.pathname.startsWith('/complaints') ? 'var(--primary)' : 'var(--text-secondary)',
          fontWeight: location.pathname.startsWith('/complaints') ? 600 : 400,
          transition: 'all 0.2s'
        }}>
          <MessageSquare size={20} />
          Complaints
        </Link>
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user?.name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user?.role.replace('_', ' ')}</p>
        </div>
        <button onClick={logout} className="btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}`);
    
    socket.on('ISSUE_CREATED', (data) => {
      // Logic to show a toast notification could be here
      console.log('New issue:', data);
    });

    socket.on('ISSUE_UPDATED', (data) => {
      console.log('Issue updated:', data);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
