import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Tag, AlertOctagon, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmpRes, deptRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/complaints/${id}`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/departments`),
        ]);
        setComplaint(cmpRes.data);
        setUpdateStatus(cmpRes.data.status);
        setSelectedDepts(cmpRes.data.assignments.map(a => a.departmentId));
        setDepartments(deptRes.data);
      } catch (error) {
        console.error('Error fetching complaint:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleConvertToTask = async () => {
    if (!window.confirm('Convert this complaint into an actionable interdepartmental task?')) return;
    setConverting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/complaints/${id}/convert`);
      setComplaint(response.data.complaint);
      navigate(`/issues/${response.data.issue.id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to convert. Ensure departments are assigned.');
    } finally {
      setConverting(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/complaints/${id}/status`, { status: updateStatus });
      setComplaint(response.data);
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleAssign = async () => {
    if (selectedDepts.length === 0) {
      alert('Select at least one department');
      return;
    }
    setAssigning(true);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/complaints/${id}/assign`, { departmentIds: selectedDepts });
      setComplaint(response.data);
    } catch (error) {
      alert('Error assigning departments');
    } finally {
      setAssigning(false);
    }
  };

  const handleFlagToggle = async () => {
    const action = complaint.is_flagged ? 'unflag' : 'flag as spam/fake';
    if (!window.confirm(`Are you sure you want to ${action} this complaint?`)) return;
    setFlagging(true);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/complaints/${id}/flag`, {
        is_flagged: !complaint.is_flagged,
      });
      setComplaint(response.data.complaint);
    } catch (error) {
      alert('Error updating flag status');
    } finally {
      setFlagging(false);
    }
  };

  const toggleDept = (deptId) => {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    );
  };

  const statusColors = {
    RECEIVED:    '#60A5FA',
    ASSIGNED:    '#A78BFA',
    IN_PROGRESS: '#F59E0B',
    RESOLVED:    '#10B981',
    CLOSED:      '#6B7280',
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading complaint...</div>;
  if (!complaint) return <div style={{ padding: '2rem', color: '#F87171' }}>Complaint not found</div>;

  const isConverted = complaint.issueId !== null;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/complaints')} className="btn" style={{ background: 'transparent', padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} /> Back to Inbox
        </button>
      </div>

      {/* Spam/Fake Banner */}
      {complaint.is_flagged && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#F87171', padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <AlertOctagon size={20} /> This complaint has been marked as Spam / Fake and closed.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* ─── Main Detail Panel ─── */}
        <div>
          <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                  Complaint #CMP-{complaint.id}
                </span>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.4 }}>
                  {complaint.description.slice(0, 80)}{complaint.description.length > 80 ? '...' : ''}
                </h1>
              </div>
              <span style={{
                background: `${statusColors[complaint.status] || '#6B7280'}22`,
                color: statusColors[complaint.status] || '#6B7280',
                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
              }}>
                {complaint.status.replace('_', ' ')}
              </span>
            </div>

            {/* Metadata grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <User size={15} /> Citizen
                </div>
                <p style={{ fontWeight: 500 }}>{complaint.citizenName || 'Anonymous'}</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <MapPin size={15} /> Location
                </div>
                <p style={{ fontWeight: 500 }}>{complaint.location || 'Not specified'}</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <Tag size={15} /> Issue Type
                </div>
                <p style={{ fontWeight: 500 }}>{complaint.issue_type || 'General'}</p>
              </div>
            </div>

            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Full Description</h3>
            <p style={{ lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {complaint.description}
            </p>

            {complaint.media_url && (
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>📎 Attached Media</p>
                <p style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>{complaint.media_url}</p>
              </div>
            )}

            <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Submitted: {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ─── Right Action Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Department Assignment */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Assign to Departments</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Auto-routing detected:<br />
              {complaint.assignments.length > 0
                ? complaint.assignments.map(a => a.department.name).join(', ')
                : 'No auto-route. Assign manually.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {departments.map(dept => (
                <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', background: selectedDepts.includes(dept.id) ? 'rgba(79,70,229,0.15)' : 'transparent', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={selectedDepts.includes(dept.id)} onChange={() => toggleDept(dept.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ fontWeight: selectedDepts.includes(dept.id) ? 600 : 400 }}>{dept.name}</span>
                </label>
              ))}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAssign} disabled={assigning || complaint.is_flagged}>
              {assigning ? 'Assigning...' : 'Save Assignment'}
            </button>
          </div>

          {/* Status Management */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Update Status</h3>
            <select className="input-field" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}
              style={{ marginBottom: '1rem' }} disabled={isConverted || complaint.is_flagged}>
              <option value="RECEIVED">Received</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}
              onClick={handleStatusUpdate} disabled={isConverted || complaint.is_flagged || updateStatus === complaint.status}>
              Update Status
            </button>
            {isConverted && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>Status locked. Track via linked Task.</p>}
          </div>

          {/* Convert to Task */}
          {!isConverted && !complaint.is_flagged && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Convert to Task</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Create an internal task visible to department field workers.
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleConvertToTask}
                disabled={converting || complaint.assignments.length === 0}>
                {converting ? 'Converting...' : 'Convert to Actionable Task'}
              </button>
              {complaint.assignments.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '0.5rem', textAlign: 'center' }}>Assign at least one department first.</p>
              )}
            </div>
          )}

          {/* Converted Link */}
          {isConverted && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <CheckCircle size={20} style={{ color: '#34D399', marginBottom: '0.5rem' }} />
              <p style={{ color: '#34D399', fontWeight: 500, marginBottom: '0.5rem' }}>Converted to Internal Task</p>
              <Link to={`/issues/${complaint.issueId}`} style={{ color: 'white', textDecoration: 'underline', fontSize: '0.9rem' }}>
                View Task #{complaint.issueId}
              </Link>
            </div>
          )}

          {/* Spam / Fake Flag */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Spam / Fake Control</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {complaint.is_flagged
                ? 'This complaint is currently flagged as spam/fake.'
                : 'Mark this complaint as spam/fake to close it and prevent further processing.'}
            </p>
            <button
              onClick={handleFlagToggle}
              disabled={flagging || isConverted}
              style={{
                width: '100%', padding: '0.65rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: complaint.is_flagged ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.15)',
                color: complaint.is_flagged ? 'var(--text-secondary)' : '#F87171',
                fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
              }}>
              <AlertOctagon size={16} />
              {flagging ? 'Updating...' : complaint.is_flagged ? 'Unflag Complaint' : 'Mark as Spam / Fake'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
