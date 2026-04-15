import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Filter, Flag, AlertOctagon } from 'lucide-react';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Read ?status= and ?flagged= from URL query params
  const params = new URLSearchParams(location.search);
  const [statusFilter, setStatusFilter] = useState(params.get('status') || 'ALL');
  const [showFlagged, setShowFlagged] = useState(params.get('flagged') === 'true');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const query = new URLSearchParams();
        if (statusFilter !== 'ALL') query.append('status', statusFilter);
        if (showFlagged) query.append('flagged', 'true');
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/complaints?${query.toString()}`);
        setComplaints(response.data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [statusFilter, showFlagged]);

  const statusColors = {
    RECEIVED:    { bg: 'rgba(99,102,241,0.15)',  text: '#818CF8' },
    ASSIGNED:    { bg: 'rgba(245,158,11,0.15)',  text: '#FCD34D' },
    IN_PROGRESS: { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA' },
    RESOLVED:    { bg: 'rgba(16,185,129,0.15)',  text: '#34D399' },
    CLOSED:      { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF' },
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
      Loading complaints...
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🗂️ Citizen Complaints Inbox</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review, assign, and act on public grievances — {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} shown
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <MessageSquare size={20} /> Incoming Complaints
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <select
              className="input-field"
              style={{ padding: '0.4rem 1rem', width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="RECEIVED">Received</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              background: showFlagged ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              color: showFlagged ? '#F87171' : 'var(--text-secondary)',
              padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
            }}>
              <input type="checkbox" checked={showFlagged} onChange={e => setShowFlagged(e.target.checked)} style={{ display: 'none' }} />
              <AlertOctagon size={15} /> Spam Only
            </label>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Citizen</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Issue Type</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Assigned To</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No complaints found.
                  </td>
                </tr>
              ) : (
                complaints.map(complaint => (
                  <tr
                    key={complaint.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: complaint.is_flagged ? 'rgba(239,68,68,0.04)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => !complaint.is_flagged && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => !complaint.is_flagged && (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.9rem 0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {complaint.is_flagged && <AlertOctagon size={14} color="#F87171" />}
                        #CMP-{complaint.id}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 0.5rem' }}>{complaint.citizenName || 'Anonymous'}</td>
                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '5px', fontSize: '0.82rem' }}>
                        {complaint.issue_type || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {complaint.assignments.length > 0 ? complaint.assignments.map(a => (
                          <span key={a.departmentId} style={{ background: 'rgba(79,70,229,0.2)', color: '#818CF8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {a.department.name}
                          </span>
                        )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Unassigned</span>}
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 0.5rem' }}>
                      <span style={{
                        background: statusColors[complaint.status]?.bg || 'rgba(107,114,128,0.15)',
                        color: statusColors[complaint.status]?.text || '#9CA3AF',
                        padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem',
                      }}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.9rem 0.5rem', textAlign: 'right' }}>
                      <Link
                        to={`/complaints/${complaint.id}`}
                        className="btn"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.07)' }}
                      >
                        Review →
                      </Link>
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
};

export default Complaints;
