import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './PatientRecords.module.css';

const API = 'http://localhost:8080';
const fmtDate = (d) => d ? String(d).split('T')[0] : '';

const CompleteAppointment = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Diagnosis Form
  const [diagType, setDiagType] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosisSaved, setDiagnosisSaved] = useState(false);

  // Prescription Form
  const [prescMeds, setPrescMeds] = useState([]);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    
    // Fetch appointment details
    axios.get(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const found = res.data.find(a => a.appntmId === parseInt(appointmentId));
        setAppointment(found);
      })
      .catch(err => console.error(err));

    // Fetch medicines catalog
    axios.get(`${API}/api/medicalrecords/medicines`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMedicines(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const handleAddMed = (medId) => {
    if (!medId) return;
    const med = medicines.find(m => m.medId === parseInt(medId));
    if (!med) return;
    if (prescMeds.find(p => p.medId === med.medId)) return;
    setPrescMeds([...prescMeds, { ...med, quantity: 1 }]);
  };

  const handleRemoveMed = (medId) => {
    setPrescMeds(prescMeds.filter(m => m.medId !== medId));
  };

  const handleUpdateQty = (medId, qty) => {
    const q = parseInt(qty);
    if (q <= 0) {
      handleRemoveMed(medId);
    } else {
      setPrescMeds(prescMeds.map(m => m.medId === medId ? { ...m, quantity: q } : m));
    }
  };

  const submitDiagnosis = async () => {
    if (!diagType || !symptoms) return alert("Fill in diagnosis details.");
    try {
        const token = localStorage.getItem('chivas_token');
        await axios.post(`${API}/api/medicalrecords/diagnosis`, {
            type: diagType,
            symptoms,
            appntmId: appointment.appntmId
        }, { headers: { Authorization: `Bearer ${token}` } });
        setDiagnosisSaved(true);
        alert("Diagnosis saved!");
    } catch (err) {
        alert(err.response?.data || "Failed to add diagnosis.");
    }
  };

  const submitPrescription = async () => {
    if (prescMeds.length === 0) return alert("Add at least one medicine.");
    try {
        const token = localStorage.getItem('chivas_token');
        await axios.post(`${API}/api/medicalrecords/prescription`, {
            appntmId: appointment.appntmId,
            medicines: prescMeds.map(m => ({ medId: m.medId, quantity: parseInt(m.quantity) }))
        }, { headers: { Authorization: `Bearer ${token}` } });
        setPrescriptionSaved(true);
        alert("Prescription created!");
    } catch (err) {
        alert(err.response?.data || "Failed to add prescription.");
    }
  };

  if (loading) return <Layout><div className={styles.empty}>Loading...</div></Layout>;
  if (!appointment) return <Layout><div className={styles.empty}>Appointment not found.</div></Layout>;

  return (
    <Layout>
      <div className={styles.main} style={{ padding: '40px' }}>
        <div className={styles.header}>
          <h1>Complete Session: {appointment.petName}</h1>
          <p>{appointment.petSpecies} · Visit on {fmtDate(appointment.date)} · {appointment.procedureName || 'Checkup'}</p>
        </div>

        <div className={styles.grid}>
          {/* Diagnosis Card */}
          <div className={styles.card} style={{ opacity: diagnosisSaved ? 0.6 : 1 }}>
            <h3>1. Diagnosis</h3>
            <input 
              placeholder="Diagnosis Type (e.g., Infection)" 
              value={diagType} 
              onChange={e => setDiagType(e.target.value)} 
              disabled={diagnosisSaved}
            />
            <textarea 
              placeholder="Symptoms observed..." 
              value={symptoms} 
              onChange={e => setSymptoms(e.target.value)} 
              disabled={diagnosisSaved}
              style={{ minHeight: '120px' }}
            />
            <button onClick={submitDiagnosis} disabled={diagnosisSaved} style={{ background: diagnosisSaved ? 'var(--green-400)' : 'var(--green-700)' }}>
              {diagnosisSaved ? '✅ Diagnosis Saved' : 'Save Diagnosis'}
            </button>
          </div>

          {/* Prescription Card */}
          <div className={styles.card} style={{ opacity: prescriptionSaved ? 0.6 : 1 }}>
            <h3>2. Prescription</h3>
            <select 
              onChange={e => handleAddMed(e.target.value)} 
              defaultValue="" 
              disabled={prescriptionSaved}
              style={{ marginBottom: '16px' }}
            >
              <option value="" disabled>Add a medicine...</option>
              {medicines.map(m => <option key={m.medId} value={m.medId}>{m.name} ({m.category})</option>)}
            </select>

            {prescMeds.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {prescMeds.map(m => (
                  <div key={m.medId} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--paper)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-400)' }}>{m.category}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="number" 
                        min="0"
                        value={m.quantity} 
                        onChange={(e) => handleUpdateQty(m.medId, e.target.value)}
                        disabled={prescriptionSaved}
                        style={{ width: '60px', margin: 0, textAlign: 'center' }}
                      />
                      {!prescriptionSaved && (
                        <button 
                          onClick={() => handleRemoveMed(m.medId)}
                          style={{ 
                            background: 'transparent', 
                            color: 'var(--danger)', 
                            border: 'none', 
                            padding: '4px',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={submitPrescription} disabled={prescriptionSaved} style={{ background: prescriptionSaved ? 'var(--green-400)' : 'var(--green-700)' }}>
              {prescriptionSaved ? '✅ Prescription Created' : 'Create Prescription'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button 
            onClick={() => navigate('/vet/schedule')}
            style={{
              padding: '12px 32px',
              background: 'white',
              border: '1px solid var(--ink-200)',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--ink-700)'
            }}
          >
            ← Back to Schedule
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CompleteAppointment;
