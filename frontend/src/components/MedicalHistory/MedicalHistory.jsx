import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './MedicalHistory.module.css';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8080';

const MedicalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingData, setRatingData] = useState({ score: 5, comment: '' });
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('chivas_token');
      const res = await axios.get(`${API}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch medical history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('chivas_token');
      await axios.post(`${API}/api/ratings`, {
        appntmId: ratingModal.appntmId,
        score: parseInt(ratingData.score),
        comment: ratingData.comment
      }, { headers: { Authorization: `Bearer ${token}` } });
      setRatingModal(null);
      setRatingData({ score: 5, comment: '' });
      fetchHistory();
    } catch (err) {
      alert('Failed to submit rating. Please try again.');
    }
  };

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Medical History</h1>
          <p className={styles.subtitle}>A complete timeline of past visits, diagnoses, and treatments for your pets.</p>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.empty}>Loading records...</div>
        ) : history.length === 0 ? (
          <div className={styles.empty}>
            No medical history found.
            <br /><br />
            <button className={styles.actionBtn} onClick={() => navigate('/book-appointment')}>
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className={styles.timeline}>
            {history.map(record => (
              <div key={record.appntmId} className={styles.recordCard}>
                
                {/* Left Side: Date & Time */}
                <div className={styles.dateCol}>
                  <div className={styles.monthName}>
                    {new Date(record.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className={styles.dayNum}>
                    {new Date(record.date).getDate()}
                  </div>
                  <div className={styles.yearNum}>
                    {new Date(record.date).getFullYear()}
                  </div>
                  <div className={styles.timeTag}>{record.time}</div>
                </div>

                {/* Right Side: Details */}
                <div className={styles.detailsCol}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.petName}>{record.petName} <span className={styles.species}>({record.species})</span></h3>
                      <p className={styles.procedureName}>{record.procedureName || 'General Consultation'}</p>
                    </div>
                    <div className={styles.vetBadge}>
                      👨‍⚕️ Dr. {record.vetName}
                    </div>
                  </div>

                  <div className={styles.gridInfo}>
                    
                    {/* Diagnosis Section */}
                    {record.diagnosisType ? (
                      <div className={styles.infoBox}>
                        <h4>🩺 Diagnosis</h4>
                        <div className={styles.highlightText}>{record.diagnosisType}</div>
                        {record.diagnosisSymptoms && (
                          <p className={styles.subText}>Symptoms: {record.diagnosisSymptoms}</p>
                        )}
                      </div>
                    ) : (
                      <div className={styles.infoBox}>
                        <h4>🩺 Diagnosis</h4>
                        <p className={styles.subText}>No specific diagnosis recorded.</p>
                      </div>
                    )}

                    {/* Prescriptions Section */}
                    {record.medicines ? (
                      <div className={styles.infoBox}>
                        <h4>💊 Prescriptions</h4>
                        <div className={styles.medicineList}>
                          {record.medicines.split(', ').map((med, idx) => (
                            <span key={idx} className={styles.medicineTag}>{med}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.infoBox}>
                        <h4>💊 Prescriptions</h4>
                        <p className={styles.subText}>No medicines prescribed.</p>
                      </div>
                    )}
                  </div>

                  {/* Notes & Billing & Rating */}
                  <div className={styles.footerRow}>
                    <div className={styles.notesSection}>
                      <strong>Follow-up Notes:</strong> {record.followUpNotes || 'None'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {record.billAmount != null && (
                        <div className={`${styles.billBadge} ${record.billStatus === 'Paid' ? styles.paid : styles.unpaid}`}>
                          {record.billStatus === 'Paid' ? '✅ Paid' : '⚠️ Unpaid'}: ${record.billAmount}
                        </div>
                      )}
                      {record.ratingScore ? (
                        <div className={styles.ratingBadge}>
                          ⭐ {record.ratingScore}/5
                          {record.ratingComment && <span className={styles.ratingComment}> "{record.ratingComment}"</span>}
                        </div>
                      ) : (
                        <button className={styles.rateBtn} onClick={() => setRatingModal(record)}>
                          ⭐ Rate Vet
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ratingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Rate Dr. {ratingModal.vetName}</h2>
              <button className={styles.closeBtn} onClick={() => setRatingModal(null)}>✕</button>
            </div>
            <form onSubmit={handleRateSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Score (1-5)</label>
                <div className={styles.stars}>
                  {[1,2,3,4,5].map(num => (
                    <span 
                      key={num} 
                      className={ratingData.score >= num ? styles.starActive : styles.starInactive}
                      onClick={() => setRatingData({...ratingData, score: num})}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Comment (Optional)</label>
                <textarea 
                  value={ratingData.comment}
                  onChange={(e) => setRatingData({...ratingData, comment: e.target.value})}
                  rows={3}
                  placeholder="How was your visit?"
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>Submit Rating</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MedicalHistory;
