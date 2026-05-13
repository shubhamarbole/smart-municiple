import { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, MapPin, Send, AlertTriangle, CheckCircle, Image as ImageIcon, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet's default icon path issues with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PublicComplaintForm = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('submit'); // 'submit' | 'track'
  const [formData, setFormData] = useState({
    citizenName: '',
    issue_type: 'Roads',
    description: '',
    latitude: null,
    longitude: null,
    locationText: '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locError, setLocError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // { trackingId, departments }
  const [error, setError] = useState('');

  // Tracking tab state
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  const fileInputRef = useRef(null);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB');
        return;
      }
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setLoadingLoc(true);
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setLoadingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationText: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Auto-detected)`,
        }));
        setLoadingLoc(false);
      },
      () => {
        setLocError('Unable to retrieve location. Please enable location services.');
        setLoadingLoc(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      // In production, use FormData + multer to upload media.
      // Here we simulate by sending the file name as media_url if selected.
      const payload = {
        citizenName: formData.citizenName || user.name,
        issue_type: formData.issue_type,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location: formData.locationText,
        media_url: mediaFile ? mediaFile.name : null,
        created_by: user.id,
      };

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/complaints`, payload);
      setSuccess(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit the complaint. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackResult(null);

    const id = trackId.replace(/^CMP-/i, '').trim();
    if (!id || isNaN(id)) {
      setTrackError('Please enter a valid Complaint ID (e.g. CMP-5)');
      return;
    }

    setTrackLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/complaints/${id}`);
      setTrackResult(response.data);
    } catch (err) {
      setTrackError(err.response?.data?.error || 'Complaint not found. Please check your ID.');
    } finally {
      setTrackLoading(false);
    }
  };

  const statusColors = {
    RECEIVED:    '#60A5FA',
    ASSIGNED:    '#A78BFA',
    IN_PROGRESS: '#F59E0B',
    RESOLVED:    '#10B981',
    CLOSED:      '#6B7280',
  };

  // ─── Success Screen ──────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg)' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34D399', borderRadius: '50%', width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Complaint Received!</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', margin: '1.5rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Your Tracking ID</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>{success.trackingId}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Save this ID to track your complaint</p>
          </div>
          {success.autoAssigned?.length > 0 && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Auto-routed to: <strong style={{ color: 'white' }}>{success.autoAssigned.join(', ')}</strong>
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => { setSuccess(null); setTab('track'); setTrackId(success.trackingId); }}>
              Track this complaint
            </button>
            <button className="btn btn-primary" onClick={() => { setSuccess(null); setFormData({ citizenName: '', issue_type: 'Roads', description: '', latitude: null, longitude: null, locationText: '' }); setMediaFile(null); setMediaPreview(null); }}>
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Layout ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', width: '40px', height: '40px', borderRadius: '50%', textDecoration: 'none' }}>
              ←
            </Link>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>🏛️ Municipal Portal</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Report and track city issues</p>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong style={{ color: 'white' }}>{user.name}</strong>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '10px' }}>
          {['submit', 'track'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: tab === t ? 'var(--primary)' : 'transparent',
                color: tab === t ? 'white' : 'var(--text-secondary)',
                fontWeight: tab === t ? 600 : 400, transition: 'all 0.2s',
              }}
            >
              {t === 'submit' ? '📝 Submit Complaint' : '🔍 Track Complaint'}
            </button>
          ))}
        </div>

        {/* ─── Submit Tab ─── */}
        {tab === 'submit' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Report an Issue</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Help us keep the city safe and clean.</p>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Name + Issue Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="label">Your Name (Optional)</label>
                  <input type="text" name="citizenName" className="input-field" placeholder="John Doe"
                    value={formData.citizenName} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label">Issue Type *</label>
                  <select name="issue_type" className="input-field" value={formData.issue_type} onChange={handleInputChange} required>
                    <option value="Water">💧 Water (Leaks, Sewers)</option>
                    <option value="Roads">🛣️ Roads (Potholes, Blocks)</option>
                    <option value="Electricity">⚡ Electricity (Poles, Wires)</option>
                    <option value="Other">📋 Other</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description *</label>
                <textarea name="description" className="input-field" placeholder="Describe the issue in detail..." rows="4"
                  value={formData.description} onChange={handleInputChange} required />
              </div>

              {/* Location */}
              <div>
                <label className="label">Location *</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input type="text" name="locationText" className="input-field" placeholder="E.g., 123 Main St crossroad"
                    value={formData.locationText} onChange={handleInputChange} style={{ flex: 1, minWidth: '200px' }} required />
                  <button type="button" onClick={handleGetLocation} className="btn"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}
                    disabled={loadingLoc}>
                    <MapPin size={16} /> {loadingLoc ? 'Detecting...' : 'Auto GPS'}
                  </button>
                </div>
                {locError && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>{locError}</p>}
                {formData.latitude && formData.longitude && (
                  <div style={{ marginTop: '1rem', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <MapContainer center={[formData.latitude, formData.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      <Marker position={[formData.latitude, formData.longitude]} />
                    </MapContainer>
                  </div>
                )}
              </div>

              {/* Media Upload */}
              <div>
                <label className="label">Upload Photo/Video (Optional)</label>
                <div onClick={handleFileClick}
                  style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(15,23,42,0.3)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
                  {!mediaPreview ? (
                    <>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                        <Camera size={24} />
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload image or video</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.7 }}>JPG, PNG or MP4. Max 5MB.</p>
                    </>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      {mediaFile?.type.startsWith('image') ? (
                        <img src={mediaPreview} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                          <ImageIcon size={24} /><span>{mediaFile?.name}</span>
                        </div>
                      )}
                      <button type="button" onClick={e => { e.stopPropagation(); setMediaFile(null); setMediaPreview(null); }}
                        style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} disabled={submitting}>
                {submitting ? 'Submitting...' : <><Send size={18} /> Submit Complaint</>}
              </button>
            </form>
          </div>
        )}

        {/* ─── Track Tab ─── */}
        {tab === 'track' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Track Your Complaint</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Enter your Tracking ID to check the status.</p>

            <form onSubmit={handleTrack} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input type="text" className="input-field" placeholder="e.g. CMP-5"
                value={trackId} onChange={e => setTrackId(e.target.value)}
                style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={trackLoading}>
                {trackLoading ? '...' : <><Search size={16} /> Track</>}
              </button>
            </form>

            {trackError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertTriangle size={16} /> {trackError}
              </div>
            )}

            {trackResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 600 }}>{trackResult.trackingId}</h3>
                  <span style={{ background: `${statusColors[trackResult.status]}20`, color: statusColors[trackResult.status], padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {trackResult.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
                  <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Issue Type</p><p style={{ fontWeight: 500 }}>{trackResult.issue_type || 'General'}</p></div>
                  <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Description</p><p>{trackResult.description}</p></div>
                  <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Location</p><p>{trackResult.location || 'Not specified'}</p></div>
                  <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Assigned To</p><p>{trackResult.assignedDepartments?.join(', ') || 'Pending assignment'}</p></div>
                  <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Submitted</p><p>{new Date(trackResult.createdAt).toLocaleString()}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicComplaintForm;
