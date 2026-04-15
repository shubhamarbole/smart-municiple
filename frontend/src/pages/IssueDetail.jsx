import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock } from 'lucide-react';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [issue, setIssue] = parseInt(id) ? useState(null) : useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/issues/${id}`);
        setIssue(response.data);
        setStatus(response.data.status);
      } catch (error) {
        console.error('Error fetching issue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (status === issue.status) return;
    setUpdating(true);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/issues/${id}`, { status });
      setIssue(response.data);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading issue details...</div>;
  if (!issue) return <div>Issue not found</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn" style={{ background: 'transparent', padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} /> Back to issues
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{issue.title}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Created by {issue.createdBy.name} on {new Date(issue.createdAt).toLocaleString()}</p>
              </div>
              <span className={`badge badge-${issue.status.toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                {issue.status.replace('_', ' ')}
              </span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Description</h3>
              <p style={{ lineHeight: 1.6 }}>{issue.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Departments Involved</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {issue.departments.map(d => (
                    <span key={d.departmentId} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                      {d.department.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Priority</h4>
                <span className={`priority-${issue.priority.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                  {issue.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Update Status</h3>
            <select 
              className="input-field" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              style={{ marginBottom: '1rem' }}
              disabled={user.role === 'FIELD_WORKER' && status === 'COMPLETED'} // simple logic
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
            </select>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              onClick={handleStatusUpdate}
              disabled={updating || status === issue.status}
            >
              {updating ? 'Updating...' : 'Save Update'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Update History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {issue.logs.map((log, index) => (
                <div key={log.id} style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                  <div style={{ position: 'absolute', left: 0, top: '5px', width: '10px', height: '10px', borderRadius: '50%', background: index === 0 ? 'var(--primary)' : 'var(--text-secondary)' }}></div>
                  {index !== issue.logs.length - 1 && (
                    <div style={{ position: 'absolute', left: '4px', top: '20px', width: '2px', height: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
                  )}
                  <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{log.actionDescription}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    by {log.user.name} • {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
