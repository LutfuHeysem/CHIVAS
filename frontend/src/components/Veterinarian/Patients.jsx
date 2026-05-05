import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './PatientRecords.module.css';

const API = 'http://localhost:8080';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/patients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPatients(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (pet) => {
    setSelectedPet(pet);
    const token = localStorage.getItem('chivas_token');
    try {
      const res = await axios.get(`${API}/api/patients/${pet.petId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetail(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`page-enter ${styles.layout}`}>
      <div className={styles.sidebar}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <h2 className={styles.title}>My Patients</h2>
        {loading ? <p>Loading...</p> : (
          <ul className={styles.appList}>
            {patients.map(p => (
              <li key={p.petId}
                className={`${styles.appItem} ${selectedPet?.petId === p.petId ? styles.active : ''}`}
                onClick={() => handleSelect(p)}>
                <div className={styles.appPet}>{p.name} ({p.species})</div>
                <div className={styles.appDate}>{p.visitCount} visit{p.visitCount !== 1 ? 's' : ''} · Last: {p.lastVisit || 'N/A'}</div>
                <div className={styles.appOwner}>Owner: {p.ownerName}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.main}>
        {!selectedPet ? (
          <div className={styles.empty}>Select a patient to view full details.</div>
        ) : !detail ? (
          <div className={styles.empty}>Loading details...</div>
        ) : (
          <>
            <div className={styles.header}>
              <h1>{detail.pet.name}</h1>
              <p>{detail.pet.species} · {detail.pet.breed} · {detail.pet.sex} · {detail.pet.age} yrs</p>
            </div>

            <div className={styles.grid}>
              {/* Pet Info Card */}
              <div className={styles.entrySection}>
                <div className={styles.card}>
                  <h3>Pet Information</h3>
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Species', detail.pet.species],
                        ['Breed', detail.pet.breed],
                        ['Sex', detail.pet.sex],
                        ['Age', `${detail.pet.age} years`],
                        ['Allergies', detail.pet.allergies || 'None'],
                      ].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: '1px solid var(--ink-100)' }}>
                          <td style={{ padding: '8px 0', fontWeight: 600, color: 'var(--ink-700)' }}>{k}</td>
                          <td style={{ padding: '8px 0', color: 'var(--ink-500)' }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.card}>
                  <h3>Owner Contact</h3>
                  <p style={{ fontSize: '14px', color: 'var(--ink-700)' }}>
                    <strong>{detail.pet.ownerName}</strong><br />
                    {detail.pet.ownerEmail && <span>📧 {detail.pet.ownerEmail}<br /></span>}
                    {detail.pet.ownerPhone && <span>📱 {detail.pet.ownerPhone}</span>}
                  </p>
                </div>
              </div>

              {/* History */}
              <div className={styles.historySection}>
                <h3>Diagnosis History</h3>
                {detail.diagnoses.length === 0 ? <p style={{ color: 'var(--ink-400)', fontSize: '14px' }}>No diagnoses on record.</p> : (
                  <div className={styles.timeline}>
                    {detail.diagnoses.map((d, i) => (
                      <div key={i} className={styles.timelineItem}>
                        <h4>{d.date} — {d.procedureName || 'Visit'}</h4>
                        <div className={styles.diagnosis}>
                          <strong>{d.type}:</strong> {d.symptoms}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h3 style={{ marginTop: '32px' }}>Vaccination Record</h3>
                {detail.vaccinations.length === 0 ? <p style={{ color: 'var(--ink-400)', fontSize: '14px' }}>No vaccinations on record.</p> : (
                  <div className={styles.timeline}>
                    {detail.vaccinations.map((v, i) => (
                      <div key={i} className={styles.timelineItem}>
                        <h4>{v.vaccineType} — Dose {v.doseNumber}</h4>
                        <div className={styles.diagnosis}>
                          <strong>Planned:</strong> {v.plannedDate} · <strong>Status:</strong> {v.status}
                        </div>
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

export default Patients;
