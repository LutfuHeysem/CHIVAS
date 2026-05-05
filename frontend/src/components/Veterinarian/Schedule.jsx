import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a => {
    const d = fmtDate(a.date);
    if (filter === 'upcoming') return d >= today;
    if (filter === 'past') return d < today;
    return true;
  });

  return (
    <div className={`page-enter ${styles.layout}`}>
      <div className={styles.sidebar}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <h2 className={styles.title}>Schedule</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {['all', 'upcoming', 'past'].map(f => (
            <button key={f} className={`${styles.appItem} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? 'All Appointments' : f === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--ink-400)' }}>
          Showing {filtered.length} of {appointments.length} appointments
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.header}>
          <h1>Full Schedule</h1>
          <p>{filtered.length} appointment{filtered.length !== 1 ? 's' : ''} — {filter === 'all' ? 'all time' : filter}</p>
        </div>

        {loading ? <p>Loading...</p> : filtered.length === 0 ? (
          <div className={styles.empty}>No appointments found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(a => (
              <div key={a.appntmId} className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{a.petName} ({a.petSpecies})</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-500)' }}>
                      Owner: {a.ownerName} · {a.procedureName || 'Checkup'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 600 }}>{fmtDate(a.date)}</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-400)' }}>{a.time}</div>
                  </div>
                </div>
                {a.followUpNotes && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--green-50)', borderRadius: '6px', fontSize: '13px', color: 'var(--ink-700)' }}>
                    <strong>Notes:</strong> {a.followUpNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
