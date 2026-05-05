import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './MyPets.module.css';

const API = 'http://localhost:8080';

const MyPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    allergies: '',
    sex: 'Unknown',
    age: ''
  });

  const fetchPets = async () => {
    try {
      const token = localStorage.getItem('chivas_token');
      const res = await axios.get(`${API}/api/pets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPets(res.data);
    } catch (err) {
      console.error('Failed to fetch pets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
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
      fetchPets();
    } catch (err) {
      alert('Failed to add pet');
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
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>{pet.name ? pet.name.charAt(0) : '?'}</div>
                  <div>
                    <div className={styles.petName}>{pet.name}</div>
                    <div className={styles.petSpecies}>{pet.species} • {pet.breed || 'Unknown breed'}</div>
                  </div>
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
