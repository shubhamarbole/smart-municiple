import { Link } from 'react-router-dom';
import { FilePlus, Search, ShieldCheck, Zap, Droplets, Map } from 'lucide-react';

const CitizenLanding = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ padding: '1.5rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
            SC
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>SmartCity</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Citizen Portal</span>
          </div>
        </div>
        <Link to="/login" className="btn btn-secondary">Staff Login</Link>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 5%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Building a Better City Together
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '3rem' }}>
          Report local issues, track their progress in real-time, and help us maintain a safe and clean environment for everyone.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/report" className="card hover-effect" style={{ padding: '2rem', width: '300px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FilePlus size={30} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text)' }}>Report an Issue</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Found a pothole, water leak, or broken streetlight? Let us know.</p>
          </Link>

          <Link to="/track" className="card hover-effect" style={{ padding: '2rem', width: '300px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Search size={30} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text)' }}>Track Status</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Check the progress of an issue you've already reported.</p>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div style={{ marginTop: '5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', opacity: 0.8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={20} color="var(--success)" /> <span>Verified Handling</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Zap size={20} color="var(--warning)" /> <span>Fast Response</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Map size={20} color="var(--primary)" /> <span>Smart Routing</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CitizenLanding;
