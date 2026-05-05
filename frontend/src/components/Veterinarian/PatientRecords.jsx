import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './PatientRecords.module.css';

const API = 'http://localhost:8080';
const fmtDate = (d) => d ? String(d).split('T')[0] : '';

const PatientRecords = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAppointments(res.data.filter(a => a.status === 'Completed')))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectAppt = async (appt) => {
    setSelectedAppt(appt);
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

  return (
    <Layout>
      <div className={styles.layout} style={{ height: 'calc(100vh - 0px)', background: 'transparent' }}>
        <div className={styles.sidebar} style={{ background: 'white', borderRight: '1px solid var(--ink-200)' }}>
          <h2 className={styles.title}>Completed Visits</h2>
          {loading ? <p>Loading...</p> : (
            <ul className={styles.appList}>
              {appointments.length === 0 ? <p style={{ color: 'var(--ink-400)', fontSize: '13px' }}>No completed appointments yet.</p> : appointments.map(a => (
                <li 
                  key={a.appntmId} 
                  className={`${styles.appItem} ${selectedAppt?.appntmId === a.appntmId ? styles.active : ''}`}
                  onClick={() => handleSelectAppt(a)}
                >
                  <div className={styles.appPet}>{a.petName} ({a.petSpecies})</div>
                  <div className={styles.appDate}>{fmtDate(a.date)}</div>
                  <div className={styles.appOwner}>Owner: {a.ownerName}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.main}>
          {!selectedAppt ? (
            <div className={styles.empty}>Select a completed visit to view history.</div>
          ) : (
            <>
              <div className={styles.header}>
                <h1>{selectedAppt.petName} ({selectedAppt.petSpecies})</h1>
                <p>Visit on {fmtDate(selectedAppt.date)} at {selectedAppt.time} for {selectedAppt.procedureName || 'Checkup'}</p>
              </div>

              <div className={styles.historySection}>
                <h3>Full Medical History</h3>
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
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PatientRecords;
