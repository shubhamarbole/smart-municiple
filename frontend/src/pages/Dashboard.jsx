import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertCircle, Clock, CheckCircle, AlertTriangle, MessageSquare, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, to }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: to ? 'pointer' : 'default', transition: 'transform 0.2s' }}
      onMouseEnter={e => { if (to) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ padding: '1rem', borderRadius: '12px', background: `rgba(${color}, 0.12)`, color: `rgb(${color})` }}>
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{title}</p>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</h3>
      </div>
    </div>
  </Link>
);

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [complaintStats, setComplaintStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [issuesRes, statsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/issues`),
          user?.role === 'ADMIN'
            ? axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/admin/stats`)
            : Promise.resolve(null),
        ]);
        setIssues(issuesRes.data);
        if (statsRes) setComplaintStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const issueStats = {
    open:       issues.filter(i => i.status === 'OPEN').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    completed:  issues.filter(i => i.status === 'COMPLETED').length,
    delayed:    issues.filter(i => i.status === 'DELAYED').length,
  };

  const issueChartData = [
    { name: 'Open',        count: issueStats.open },
    { name: 'In Progress', count: issueStats.inProgress },
    { name: 'Completed',   count: issueStats.completed },
    { name: 'Delayed',     count: issueStats.delayed },
  ];

  const complaintChartData = complaintStats ? [
    { name: 'Pending',     value: complaintStats.pending },
    { name: 'In Progress', value: complaintStats.inProgress },
    { name: 'Resolved',    value: complaintStats.resolved },
    { name: 'Flagged',     value: complaintStats.flagged },
  ] : [];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
      Loading dashboard...
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <strong>{user?.name}</strong> ({user?.role})</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user?.role === 'ADMIN' && (
            <Link to="/complaints" className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
              View Complaints
            </Link>
          )}
          <Link to="/issues" className="btn btn-primary">View All Issues</Link>
        </div>
      </div>

      {/* ─── Complaint Stats (Admin only) ─── */}
      {user?.role === 'ADMIN' && complaintStats && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📋 Citizen Complaints
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <StatCard title="Total Complaints"  value={complaintStats.total}      icon={<MessageSquare size={26} />} color="139, 92, 246"  to="/complaints" />
            <StatCard title="Pending"           value={complaintStats.pending}    icon={<Clock size={26} />}        color="245, 158, 11" to="/complaints?status=RECEIVED" />
            <StatCard title="In Progress"       value={complaintStats.inProgress} icon={<AlertCircle size={26} />} color="59, 130, 246"  to="/complaints?status=IN_PROGRESS" />
            <StatCard title="Resolved"          value={complaintStats.resolved}   icon={<CheckCircle size={26} />} color="16, 185, 129"  to="/complaints?status=RESOLVED" />
            <StatCard title="Spam / Fake"       value={complaintStats.flagged}    icon={<Flag size={26} />}        color="239, 68, 68"  to="/complaints?flagged=true" />
          </div>
        </>
      )}

      {/* ─── Issue Stats ─── */}
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        🔧 Internal Tasks / Issues
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <StatCard title="Open Issues"   value={issueStats.open}       icon={<AlertCircle size={26} />} color="59, 130, 246"  to="/issues" />
        <StatCard title="In Progress"   value={issueStats.inProgress} icon={<Clock size={26} />}       color="245, 158, 11" to="/issues" />
        <StatCard title="Completed"     value={issueStats.completed}  icon={<CheckCircle size={26} />} color="16, 185, 129"  to="/issues" />
        <StatCard title="Delayed"       value={issueStats.delayed}    icon={<AlertTriangle size={26} />} color="239, 68, 68" to="/issues" />
      </div>

      {/* ─── Charts Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: complaintStats ? '3fr 2fr' : '1fr', gap: '1.5rem' }}>
        {/* Issues bar chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Issue Status Overview</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint pie chart (admin only) */}
        {user?.role === 'ADMIN' && complaintStats && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Complaint Breakdown</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={complaintChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value">
                    {complaintChartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Issues ─── */}
      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Recent Internal Tasks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {issues.slice(0, 6).map(issue => (
            <Link key={issue.id} to={`/issues/${issue.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                borderLeft: `4px solid ${issue.status === 'OPEN' ? '#3B82F6' : issue.status === 'IN_PROGRESS' ? '#F59E0B' : issue.status === 'COMPLETED' ? '#10B981' : '#EF4444'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%', color: 'white', margin: 0 }}>
                  {issue.title}
                </h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                  <span className={`badge badge-${issue.status.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {issues.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No internal tasks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
