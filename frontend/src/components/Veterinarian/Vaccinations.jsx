import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './PatientRecords.module.css'; // Reusing the layout

const API = 'http://localhost:8080';

const Vaccinations = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [availableVaccines, setAvailableVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newVacId, setNewVacId] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [doseNum, setDoseNum] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    
    axios.get(`${API}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAppointments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    axios.get(`${API}/api/vaccinations/available`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAvailableVaccines(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSelectPatient = async (p) => {
    setSelectedPet(p);
    const token = localStorage.getItem('chivas_token');
    try {
        const res = await axios.get(`${API}/api/vaccinations/pet/${p.petId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setVaccinations(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleSchedule = async () => {
    if (!newVacId || !plannedDate) return alert("Select a vaccine and date.");
    try {
        const token = localStorage.getItem('chivas_token');
        await axios.post(`${API}/api/vaccinations`, {
            petId: selectedPet.petId,
            vaccineId: parseInt(newVacId),
            plannedDate: plannedDate,
            doseNumber: parseInt(doseNum)
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        alert("Vaccine scheduled!");
        handleSelectPatient(selectedPet); // Refresh list
    } catch (err) {
        alert(err.response?.data || "Failed to schedule vaccine.");
    }
  };

  const handleUpdateStatus = async (planId, vaccineId, doseNumber, newStatus) => {
    try {
        const token = localStorage.getItem('chivas_token');
        await axios.put(`${API}/api/vaccinations/status`, {
            planId, vaccineId, doseNumber, status: newStatus
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        handleSelectPatient(selectedPet); // Refresh list
    } catch (err) {
        alert("Failed to update status.");
    }
  };

  const uniquePatients = Array.from(new Map(appointments.map(a => [a.petId, a])).values());

  return (
    <Layout>
      <div className={styles.layout} style={{ background: 'transparent' }}>
        <div className={styles.sidebar} style={{ background: 'white', borderRight: '1px solid var(--ink-200)' }}>
          <h2 className={styles.title}>Select Patient</h2>
          {loading ? <p>Loading...</p> : (
            <ul className={styles.appList}>
              {uniquePatients.length === 0 ? <p style={{ color: 'var(--ink-400)', fontSize: '13px' }}>No patients found.</p> : uniquePatients.map(p => (
                <li 
                  key={p.petId} 
                  className={`${styles.appItem} ${selectedPet?.petId === p.petId ? styles.active : ''}`}
                  onClick={() => handleSelectPatient(p)}
                >
                  <div className={styles.appPet}>{p.petName} ({p.petSpecies})</div>
                  <div className={styles.appOwner}>Owner: {p.ownerName}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.main}>
          {!selectedPet ? (
            <div className={styles.empty}>Select a patient to manage vaccinations.</div>
          ) : (
            <>
              <div className={styles.header}>
                <h1>{selectedPet.petName}'s Vaccinations</h1>
                <p>Manage vaccination plans and doses.</p>
              </div>

              <div className={styles.grid}>
                <div className={styles.entrySection}>
                  <div className={styles.card}>
                    <h3>Schedule Vaccine Dose</h3>
                    <select value={newVacId} onChange={e => setNewVacId(e.target.value)}>
                        <option value="" disabled>Select Vaccine...</option>
                        {availableVaccines.map(v => (
                            <option key={v.vaccineId} value={v.vaccineId}>{v.type} ({v.cycleProtocol})</option>
                        ))}
                    </select>
                    <label style={{ fontSize: '12px', color: 'var(--ink-500)', marginBottom: '4px', display: 'block' }}>Planned Date</label>
                    <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
                    
                    <label style={{ fontSize: '12px', color: 'var(--ink-500)', marginBottom: '4px', display: 'block' }}>Dose Number</label>
                    <input type="number" min="1" value={doseNum} onChange={e => setDoseNum(e.target.value)} />
                    
                    <button onClick={handleSchedule}>Schedule Dose</button>
                  </div>
                </div>

                <div className={styles.historySection}>
                  <h3>Vaccination Plan History</h3>
                  {vaccinations.length === 0 ? <p>No vaccines scheduled.</p> : (
                      <div className={styles.timeline}>
                          {vaccinations.map((v, i) => (
                              <div key={i} className={styles.timelineItem}>
                                  <h4>{v.vaccineType} (Dose {v.doseNumber})</h4>
                                  <div className={styles.diagnosis} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                          <strong>Planned:</strong> {v.plannedDate} <br/>
                                          <strong>Status:</strong> {v.status}
                                      </div>
                                      {v.status === 'Pending' && (
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                              <button 
                                                  onClick={() => handleUpdateStatus(v.planId, v.vaccineId, v.doseNumber, 'Administered')}
                                                  style={{ padding: '6px 12px', background: 'var(--green-600)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                  Mark Administered
                                              </button>
                                              <button 
                                                  onClick={() => handleUpdateStatus(v.planId, v.vaccineId, v.doseNumber, 'Missed')}
                                                  style={{ padding: '6px 12px', background: 'var(--warn)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                  Mark Missed
                                              </button>
                                          </div>
                                      )}
                                  </div>
                                  <p className={styles.vetNote}>Prescribed by: Dr. {v.vetName}</p>
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
    </Layout>
  );
};

export default Vaccinations;
