import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Filter } from 'lucide-react';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Issues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/issues`);
        setIssues(response.data);
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const filteredIssues = filter === 'ALL' ? issues : issues.filter(i => i.status === filter);

  if (loading) return <div>Loading issues...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Issues Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage interdepartmental tasks</p>
        </div>
        <button className="btn btn-primary"><Plus size={18} /> New Issue</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600 }}>Active Issues</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="input-field" 
                style={{ padding: '0.4rem 1rem', width: 'auto' }}
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {filteredIssues.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No issues found.</p>
            ) : (
              filteredIssues.map((issue) => (
                <div key={issue.id} style={{ padding: '1rem', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      <Link to={`/issues/${issue.id}`} style={{ color: 'white', textDecoration: 'none' }}>{issue.title}</Link>
                    </h4>
                    <span className={`badge badge-${issue.status.toLowerCase()}`}>{issue.status.replace('_', ' ')}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {issue.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {issue.departments.map(d => (
                        <span key={d.departmentId} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {d.department.name}
                        </span>
                      ))}
                    </div>
                    <span className={`priority-${issue.priority.toLowerCase()}`}>
                      Priority: {issue.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card" style={{ overflow: 'hidden', height: '100%', minHeight: '500px' }}>
          <MapContainer center={[19.0760, 72.8777]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {issues.map(issue => (
              issue.latitude && issue.longitude && (
                <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                  <Popup className="custom-popup">
                    <div style={{ padding: '5px' }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#1E293B' }}>{issue.title}</h3>
                      <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#475569' }}>Status: {issue.status}</p>
                      <Link to={`/issues/${issue.id}`} style={{ fontSize: '12px', color: '#4F46E5' }}>View Details</Link>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Issues;
