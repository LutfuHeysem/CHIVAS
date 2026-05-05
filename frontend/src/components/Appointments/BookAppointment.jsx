import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './BookAppointment.module.css';

const API = 'http://localhost:8080';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    petId: '',
    vetId: '',
    date: '',
    time: '',
    procedureName: '',
    followUpNotes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('chivas_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [petsRes, vetsRes] = await Promise.all([
          axios.get(`${API}/api/pets`, config),
          axios.get(`${API}/api/appointments/available-vets`, config)
        ]);

        setPets(petsRes.data);
        setVets(vetsRes.data);

        // Pre-select if only one option
        if (petsRes.data.length === 1) {
          setFormData(prev => ({ ...prev, petId: petsRes.data[0].petId }));
        }
      } catch (err) {
        console.error('Failed to fetch booking data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('chivas_token');
      await axios.post(`${API}/api/appointments/book`, {
        ...formData,
        petId: parseInt(formData.petId),
        vetId: parseInt(formData.vetId),
        time: formData.time + ':00' // Ensure HH:MM:SS format for backend if needed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      alert(err.response?.data?.Details || 'Failed to book appointment');
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Book Appointment</h1>
          <p className={styles.subtitle}>Schedule a visit for your pet with one of our veterinarians.</p>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : pets.length === 0 ? (
          <div className={styles.empty}>
            You need to add a pet before booking an appointment.
            <br /><br />
            <button className={styles.actionBtn} onClick={() => navigate('/my-pets')}>Go to My Pets</button>
          </div>
        ) : success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>🎉</div>
            <h2>Appointment Booked!</h2>
            <p>Your appointment has been successfully scheduled. Redirecting you to the dashboard...</p>
          </div>
        ) : (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Select Pet *</label>
                <select name="petId" value={formData.petId} onChange={handleChange} required>
                  <option value="" disabled>Choose your pet</option>
                  {pets.map(p => (
                    <option key={p.petId} value={p.petId}>{p.name} ({p.species})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Select Veterinarian *</label>
                <select name="vetId" value={formData.vetId} onChange={handleChange} required>
                  <option value="" disabled>Choose a veterinarian</option>
                  {vets.map(v => (
                    <option key={v.vetId} value={v.vetId}>Dr. {v.name} - {v.specialty}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date *</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className={styles.formGroup}>
                <label>Time *</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Reason for Visit / Procedure</label>
              <input type="text" name="procedureName" value={formData.procedureName} onChange={handleChange} placeholder="e.g. General Checkup, Vaccination" />
            </div>

            <div className={styles.formGroup}>
              <label>Additional Notes</label>
              <textarea name="followUpNotes" value={formData.followUpNotes} onChange={handleChange} placeholder="Any symptoms or notes for the doctor?" rows={3} />
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default BookAppointment;
