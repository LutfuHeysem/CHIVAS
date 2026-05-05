import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './ManagerPages.module.css';

const API = 'http://localhost:8080';

const Staff = () => {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/clinicmanager/staff`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStaff(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!staff.length) return <Layout><div className={styles.loading}>Loading staff...</div></Layout>;

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Staff Management</h1>
          <p>Overview of clinic veterinarians and their performance ratings.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Active Veterinarians</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialty</th>
                <th>Species Expertise</th>
                <th>Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id}>
                  <td><strong>Dr. {member.firstName || member.FirstName} {member.surname || member.Surname}</strong></td>
                  <td>{member.email || member.Email}</td>
                  <td>{member.specialty || member.Specialty}</td>
                  <td>{member.speciesExpertise || member.SpeciesExpertise}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.blue}`}>
                      ⭐ {Number(member.averageRating || member.AverageRating).toFixed(1)} / 5.0
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Staff;
