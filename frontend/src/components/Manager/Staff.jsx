import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './Manager.module.css';

const API = 'http://localhost:8080';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = () => {
      const token = localStorage.getItem('chivas_token');
      axios.get(`${API}/api/clinicmanager/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setStaff(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchStaff();
  }, []);

  const renderStars = (rating) => {
    const num = Math.round(rating);
    if (num === 0) return 'No ratings';
    return (
      <span className={styles.starRating}>
        {'★'.repeat(num)}{'☆'.repeat(5 - num)}
      </span>
    );
  };

  return (
    <Layout>
      <div className={styles.header}>
        <h2>👥 Staff Management</h2>
        <p>View clinic veterinarians and their average ratings.</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <p>Loading staff...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialty</th>
                <th>Species Expertise</th>
                <th>Average Rating</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.vetId}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.specialty || 'General'}</td>
                  <td>{s.speciesExpertise || 'All'}</td>
                  <td>
                    {renderStars(s.averageRating)}
                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '6px' }}>
                      ({s.ratingCount})
                    </span>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles.textCenter}>No staff found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default Staff;
