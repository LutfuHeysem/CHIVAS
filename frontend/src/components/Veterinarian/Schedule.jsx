import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './PatientRecords.module.css';

const API = 'http://localhost:8080';
const fmtDate = (d) => d ? String(d).split('T')[0] : '';

const Schedule = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | upcoming | past

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAppointments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (apptId) => {
    const token = localStorage.getItem('chivas_token');
    try {
      await axios.put(`${API}/api/appointments/${apptId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/vet/complete/${apptId}`);
    } catch (err) {
      alert(err.response?.data || "Failed to complete appointment.");
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a => {
    const d = fmtDate(a.date);
    if (filter === 'upcoming') return d >= today && a.status === 'Scheduled';
    if (filter === 'past') return d < today || a.status === 'Completed';
    return true;
  });

  return (
    <Layout>
      <div className={styles.main} style={{ padding: '40px' }}>
        <div className={styles.header}>
          <h1>Full Schedule</h1>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {['all', 'upcoming', 'past'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid var(--ink-200)',
                  background: filter === f ? 'var(--green-600)' : 'white',
                  color: filter === f ? 'white' : 'var(--ink-700)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p>Loading...</p> : filtered.length === 0 ? (
          <div className={styles.emptyState}>No appointments found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(a => (
              <div key={a.appntmId} className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{a.petName} ({a.petSpecies})</h3>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      background: a.status === 'Completed' ? 'var(--green-100)' : a.status === 'Cancelled' ? 'var(--warn-light)' : 'var(--sky-soft)',
                      color: a.status === 'Completed' ? 'var(--green-800)' : a.status === 'Cancelled' ? 'var(--warn-dark)' : 'var(--sky)'
                    }}>
                      {a.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-500)' }}>
                    Owner: {a.ownerName} · {a.procedureName || 'Checkup'}
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--ink-400)' }}>
                    📅 {fmtDate(a.date)} at {a.time}
                  </div>
                </div>
                
                {a.status === 'Scheduled' && fmtDate(a.date) <= today && (
                  <button 
                    onClick={() => handleComplete(a.appntmId)}
                    style={{
                      padding: '10px 20px',
                      background: 'var(--green-600)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Complete Appointment
                  </button>
                )}
                
                {a.status === 'Completed' && (
                  <button 
                    onClick={() => navigate(`/vet/complete/${a.appntmId}`)}
                    style={{
                      padding: '10px 20px',
                      background: 'white',
                      color: 'var(--green-700)',
                      border: '1px solid var(--green-600)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Schedule;
