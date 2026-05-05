import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './PatientRecords.module.css';

const API = 'http://localhost:8080';

const fmtDate = (d) => d ? String(d).split('T')[0] : '';

const PatientRecords = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [history, setHistory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Diagnosis Form
  const [diagType, setDiagType] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Prescription Form
  const [prescMeds, setPrescMeds] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAppointments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    axios.get(`${API}/api/medicalrecords/medicines`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMedicines(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSelectAppt = async (appt) => {
    setSelectedAppt(appt);
    setDiagType('');
    setSymptoms('');
    setPrescMeds([]);
    
    const token = localStorage.getItem('chivas_token');
    try {
        const res = await axios.get(`${API}/api/medicalrecords/pet/${appt.petId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setHistory(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleAddMed = (medId) => {
    if (!medId) return;
    const med = medicines.find(m => m.medId === parseInt(medId));
    if (!med) return;
    if (prescMeds.find(p => p.medId === med.medId)) return;
    setPrescMeds([...prescMeds, { ...med, quantity: 1 }]);
  };

  const submitDiagnosis = async () => {
    if (!diagType || !symptoms) return alert("Fill in diagnosis details.");
    try {
        const token = localStorage.getItem('chivas_token');
        await axios.post(`${API}/api/medicalrecords/diagnosis`, {
            type: diagType,
            symptoms,
            appntmId: selectedAppt.appntmId
        }, { headers: { Authorization: `Bearer ${token}` } });
        alert("Diagnosis added!");
        handleSelectAppt(selectedAppt); // refresh history
    } catch (err) {
        alert(err.response?.data || "Failed to add diagnosis.");
    }
  };

  const submitPrescription = async () => {
    if (prescMeds.length === 0) return alert("Add at least one medicine.");
    try {
        const token = localStorage.getItem('chivas_token');
        await axios.post(`${API}/api/medicalrecords/prescription`, {
            appntmId: selectedAppt.appntmId,
            medicines: prescMeds.map(m => ({ medId: m.medId, quantity: parseInt(m.quantity) }))
        }, { headers: { Authorization: `Bearer ${token}` } });
        alert("Prescription added!");
        handleSelectAppt(selectedAppt); // refresh history
    } catch (err) {
        alert(err.response?.data || "Failed to add prescription.");
    }
  };

  return (
    <div className={`page-enter ${styles.layout}`}>
      <div className={styles.sidebar}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <h2 className={styles.title}>Your Patients</h2>
        {loading ? <p>Loading...</p> : (
          <ul className={styles.appList}>
            {appointments.map(a => (
              <li 
                key={a.appntmId} 
                className={`${styles.appItem} ${selectedAppt?.appntmId === a.appntmId ? styles.active : ''}`}
                onClick={() => handleSelectAppt(a)}
              >
                <div className={styles.appPet}>{a.petName} ({a.petSpecies})</div>
                <div className={styles.appDate}>{fmtDate(a.date)} at {a.time}</div>
                <div className={styles.appOwner}>Owner: {a.ownerName}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.main}>
        {!selectedAppt ? (
          <div className={styles.empty}>Select a patient appointment to view records.</div>
        ) : (
          <>
            <div className={styles.header}>
              <h1>{selectedAppt.petName} ({selectedAppt.petSpecies})</h1>
              <p>Appointment on {fmtDate(selectedAppt.date)} at {selectedAppt.time} for {selectedAppt.procedureName || 'Checkup'}</p>
            </div>

            <div className={styles.grid}>
              {/* Record Entry */}
              <div className={styles.entrySection}>
                <div className={styles.card}>
                  <h3>Add Diagnosis</h3>
                  <input placeholder="Diagnosis Type (e.g., Infection)" value={diagType} onChange={e => setDiagType(e.target.value)} />
                  <textarea placeholder="Symptoms observed..." value={symptoms} onChange={e => setSymptoms(e.target.value)} />
                  <button onClick={submitDiagnosis}>Save Diagnosis</button>
                </div>

                <div className={styles.card}>
                  <h3>Write Prescription</h3>
                  <select onChange={e => handleAddMed(e.target.value)} defaultValue="">
                      <option value="" disabled>Select a medicine to add...</option>
                      {medicines.map(m => <option key={m.medId} value={m.medId}>{m.name} ({m.category})</option>)}
                  </select>
                  {prescMeds.length > 0 && (
                      <ul className={styles.medList}>
                          {prescMeds.map((m, idx) => (
                              <li key={m.medId}>
                                  <span>{m.name}</span>
                                  <input type="number" min="1" value={m.quantity} onChange={(e) => {
                                      const newMeds = [...prescMeds];
                                      newMeds[idx].quantity = e.target.value;
                                      setPrescMeds(newMeds);
                                  }} />
                              </li>
                          ))}
                      </ul>
                  )}
                  <button onClick={submitPrescription}>Create Prescription</button>
                </div>
              </div>

              {/* History Timeline */}
              <div className={styles.historySection}>
                <h3>Medical History</h3>
                {history.length === 0 ? <p>No previous records found.</p> : (
                    <div className={styles.timeline}>
                        {history.map(h => (
                            <div key={h.appntmId} className={styles.timelineItem}>
                                <h4>{h.date} - {h.procedureName || 'Visit'}</h4>
                                {h.diagnosisType && (
                                    <div className={styles.diagnosis}>
                                        <strong>Diagnosis:</strong> {h.diagnosisType} - {h.symptoms}
                                    </div>
                                )}
                                {h.prescriptionId && (
                                    <div className={styles.prescription}>
                                        <strong>Prescription Issued</strong> (ID: {h.prescriptionId})
                                    </div>
                                )}
                                <p className={styles.vetNote}>Attending Vet: Dr. {h.vetName}</p>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;
