import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api` 
  : 'http://localhost:5000/api';

const CitizenTrack = () => {
  const [trackingId, setTrackingId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError(null);
    setComplaint(null);

    try {
      // Clean up CMP- prefix if user entered it
      const numericId = trackingId.toUpperCase().replace('CMP-', '').trim();
      
      const response = await axios.get(`${API_BASE_URL}/complaints/${numericId}`);
      setComplaint(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Complaint not found. Please check the ID and try again.');
      } else {
        setError('An error occurred while tracking the complaint.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RECEIVED': return 'var(--info)';
      case 'ASSIGNED': return 'var(--warning)';
      case 'IN_PROGRESS': return 'var(--primary)';
      case 'RESOLVED': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RECEIVED': return <Clock size={20} />;
      case 'ASSIGNED': return <User size={20} />;
      case 'IN_PROGRESS': return <AlertTriangle size={20} />;
      case 'RESOLVED': return <CheckCircle size={20} />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Simple Header */}
      <nav style={{ padding: '1.5rem 5%', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft size={20} /> Back to Home
        </Link>
      </nav>

      <main style={{ flex: 1, padding: '3rem 5%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 1rem' }}>
            <Search size={30} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Track Your Issue</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your Tracking ID below to see the current status.</p>
        </div>

        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px', marginBottom: '3rem' }}>
          <input
            type="text"
            className="input"
            placeholder="e.g. CMP-7"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 2rem', fontSize: '1.1rem' }}>
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {complaint && (
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tracking ID</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.25rem' }}>{complaint.trackingId}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `rgba(255,255,255,0.05)`, padding: '0.5rem 1rem', borderRadius: '20px', color: getStatusColor(complaint.status), border: `1px solid ${getStatusColor(complaint.status)}` }}>
                {getStatusIcon(complaint.status)}
                <span style={{ fontWeight: 600 }}>{complaint.status.replace('_', ' ')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Issue Type</h4>
                <p style={{ fontWeight: 500 }}>{complaint.issue_type}</p>
              </div>
              
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Description</h4>
                <p style={{ background: 'var(--surface-light)', padding: '1rem', borderRadius: '8px', lineHeight: 1.5 }}>{complaint.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Location</h4>
                  <p>{complaint.location}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Date Reported</h4>
                  <p>{new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {complaint.assignedDepartments && complaint.assignedDepartments.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Assigned To</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {complaint.assignedDepartments.map((dept, idx) => (
                      <span key={idx} style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 500 }}>
                        {dept} Department
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenTrack;
