import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './MyPets.module.css';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8080';

const MyPets = () => {
  const [pets, setPets] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    allergies: '',
    sex: 'Unknown',
    age: ''
  });

  const fetchPetsAndVaccines = async () => {
    try {
      const token = localStorage.getItem('chivas_token');
      const [petRes, vacRes] = await Promise.all([
        axios.get(`${API}/api/pets`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/vaccinations/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPets(petRes.data);
      setVaccinations(vacRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetsAndVaccines();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('chivas_token');
      await axios.post(`${API}/api/pets`, {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setFormData({ name: '', species: '', breed: '', allergies: '', sex: 'Unknown', age: '' });
      fetchPetsAndVaccines();
    } catch (err) {
      alert('Failed to add pet');
      console.error(err);
    }
  };

  const handleDelete = async (petId, petName) => {
    if (!window.confirm(`Are you sure you want to delete ${petName}? This will permanently delete their medical history as well.`)) return;
    try {
      const token = localStorage.getItem('chivas_token');
      await axios.delete(`${API}/api/pets/${petId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPetsAndVaccines();
    } catch (err) {
      alert('Failed to delete pet');
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Pets</h1>
          <p className={styles.subtitle}>Manage your furry friends and their health profiles.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <span>➕</span> Add New Pet
        </button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.empty}>Loading pets...</div>
        ) : pets.length === 0 ? (
          <div className={styles.empty}>You don't have any pets registered yet.</div>
        ) : (
          <div className={styles.grid}>
            {pets.map(pet => (
              <div key={pet.petId} className={styles.card}>
                <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className={styles.avatar}>{pet.name ? pet.name.charAt(0) : '?'}</div>
                    <div>
                      <div className={styles.petName}>{pet.name}</div>
                      <div className={styles.petSpecies}>{pet.species} • {pet.breed || 'Unknown breed'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(pet.petId, pet.name)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--red-600)', padding: '4px' }}
                    title="Delete Pet"
                  >
                    🗑️
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Age</span>
                    <span className={styles.infoValue}>{pet.age || '?'} yrs</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Sex</span>
                    <span className={styles.infoValue}>{pet.sex}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Allergies</span>
                    <span className={styles.infoValue}>{pet.allergies || 'None'}</span>
                  </div>

                  {/* Vaccinations Section */}
                  <div className={styles.vaccineSection}>
                    <h4>💉 Vaccinations</h4>
                    {vaccinations.filter(v => v.petId === pet.petId).length === 0 ? (
                      <p className={styles.subText}>No vaccination plan found.</p>
                    ) : (
                      <div className={styles.vaccineList}>
                        {vaccinations.filter(v => v.petId === pet.petId).map((v, i) => {
                           const isOverdue = v.status === 'Pending' && new Date(v.plannedDate) < new Date(new Date().setHours(0,0,0,0));
                           let badgeClass = styles.vacPending;
                           let statusIcon = '⏳';
                           if (v.status === 'Administered') { badgeClass = styles.vacAdministered; statusIcon = '✅'; }
                           if (isOverdue || v.status === 'Missed') { badgeClass = styles.vacOverdue; statusIcon = '⚠️'; }
                           
                           return (
                             <div key={i} className={`${styles.vaccineItem} ${badgeClass}`}>
                               <div>
                                 <span style={{marginRight: '6px'}}>{statusIcon}</span>
                                 <strong>{v.vaccineName}</strong> <span style={{opacity: 0.8}}>(Dose {v.doseNumber})</span>
                               </div>
                               <div style={{fontSize: '12px', fontWeight: 'bold'}}>{v.plannedDate}</div>
                             </div>
                           )
                        })}
                      </div>
                    )}
                    <button 
                      className={styles.bookVacBtn} 
                      onClick={() => navigate('/book-appointment')}
                    >
                      📅 Book Vaccination
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Register New Pet</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} placeholder="Fido" />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Species</label>
                  <input name="species" value={formData.species} onChange={handleChange} placeholder="Dog, Cat, etc." />
                </div>
                <div className={styles.formGroup}>
                  <label>Breed</label>
                  <input name="breed" value={formData.breed} onChange={handleChange} placeholder="Golden Retriever" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 3" min="0" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Allergies / Special Notes</label>
                <textarea name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Any known allergies?" rows={2} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Save Pet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyPets;
