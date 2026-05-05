import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './PatientRecords.module.css';

const API = 'http://localhost:8080';

const URGENCY_COLORS = {
  Low: '#5a8aa8',
  Medium: '#b89968',
  High: '#d97757',
  Critical: '#b54848',
};

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [vets, setVets] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [toVetId, setToVetId] = useState('');
  const [petId, setPetId] = useState('');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [notes, setNotes] = useState('');

  const token = localStorage.getItem('chivas_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchReferrals = () => {
    axios.get(`${API}/api/referrals`, { headers })
      .then(res => setReferrals(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReferrals();
    axios.get(`${API}/api/referrals/vets`, { headers }).then(res => setVets(res.data)).catch(console.error);
    axios.get(`${API}/api/referrals/pets`, { headers }).then(res => setPets(res.data)).catch(console.error);
  }, []);

  const handleCreate = async () => {
    if (!toVetId || !petId || !reason) return alert('Fill in all required fields.');
    try {
      await axios.post(`${API}/api/referrals`, {
        toVetId: parseInt(toVetId), petId: parseInt(petId), reason, urgencyLevel: urgency, notes
      }, { headers });
      alert('Referral created!');
      setShowForm(false);
      setToVetId(''); setPetId(''); setReason(''); setUrgency('Medium'); setNotes('');
      fetchReferrals();
    } catch (err) {
      alert(err.response?.data || 'Failed to create referral.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/api/referrals/${id}/status`, { status, notes: '' }, { headers });
      fetchReferrals();
    } catch (err) {
      alert('Failed to update.');
    }
  };

  const incoming = referrals.filter(r => r.direction === 'Incoming');
  const outgoing = referrals.filter(r => r.direction === 'Outgoing');

  return (
    <Layout>
      <div className={styles.layout} style={{ background: 'transparent' }}>
        <div className={styles.sidebar} style={{ background: 'white', borderRight: '1px solid var(--ink-200)' }}>
          <h2 className={styles.title}>Referral Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div className={styles.appItem} style={{ background: 'var(--green-50)', borderColor: 'var(--green-300)' }}>
              <div className={styles.appPet}>📤 Outgoing: {outgoing.length}</div>
            </div>
            <div className={styles.appItem} style={{ background: 'var(--sky-soft)', borderColor: 'var(--sky)' }}>
              <div className={styles.appPet}>📥 Incoming: {incoming.length}</div>
            </div>
          </div>

          <button onClick={() => setShowForm(!showForm)} style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '10px', 
            border: '2px dashed var(--green-400)', 
            background: 'var(--green-50)', 
            color: 'var(--green-800)', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}>
            {showForm ? '✕ Cancel' : '+ New Referral'}
          </button>
        </div>

        <div className={styles.main}>
          <div className={styles.header}>
            <h1>Referral Management</h1>
            <p>Send and receive inter-clinic patient referrals.</p>
          </div>

          {showForm && (
            <div className={styles.card} style={{ marginBottom: '24px' }}>
              <h3>Create Referral</h3>
              <select value={petId} onChange={e => setPetId(e.target.value)}>
                <option value="" disabled>Select patient...</option>
                {pets.map(p => <option key={p.petId} value={p.petId}>{p.name} ({p.species})</option>)}
              </select>
              <select value={toVetId} onChange={e => setToVetId(e.target.value)}>
                <option value="" disabled>Refer to veterinarian...</option>
                {vets.map(v => <option key={v.vetId} value={v.vetId}>Dr. {v.name} — {v.specialty}</option>)}
              </select>
              <select value={urgency} onChange={e => setUrgency(e.target.value)}>
                {['Low', 'Medium', 'High', 'Critical'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input placeholder="Reason for referral..." value={reason} onChange={e => setReason(e.target.value)} />
              <textarea placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              <button onClick={handleCreate} style={{ background: 'var(--green-700)', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Send Referral</button>
            </div>
          )}

          {loading ? <p>Loading...</p> : referrals.length === 0 ? (
            <div className={styles.empty}>No referrals yet. Create one to get started.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {referrals.map(r => (
                <div key={r.referralId} className={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          background: r.direction === 'Outgoing' ? 'var(--green-100)' : 'var(--sky-soft)',
                          color: r.direction === 'Outgoing' ? 'var(--green-800)' : 'var(--sky)' }}>
                          {r.direction === 'Outgoing' ? '📤 Sent' : '📥 Received'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          background: URGENCY_COLORS[r.urgencyLevel] + '22', color: URGENCY_COLORS[r.urgencyLevel] }}>
                          {r.urgencyLevel}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          background: r.status === 'Pending' ? '#fef3c7' : r.status === 'Completed' ? 'var(--green-100)' : '#fde2e2',
                          color: r.status === 'Pending' ? '#92400e' : r.status === 'Completed' ? 'var(--green-800)' : '#991b1b' }}>
                          {r.status}
                        </span>
                      </div>
                      <h3 style={{ margin: '4px 0', fontSize: '16px' }}>{r.petName} ({r.petSpecies})</h3>
                      <p style={{ fontSize: '13px', color: 'var(--ink-500)', margin: 0 }}>
                        From Dr. {r.fromVetName} → Dr. {r.toVetName}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--ink-700)', margin: '4px 0 0' }}>{r.reason}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--ink-400)' }}>{r.referralDate}</div>
                  </div>
                  {r.status === 'Pending' && r.direction === 'Incoming' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateStatus(r.referralId, 'Completed')}
                        style={{ padding: '6px 14px', background: 'var(--green-600)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        Mark Completed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Referrals;
