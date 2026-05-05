import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './ManagerPages.module.css';

const API = 'http://localhost:8080';

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/clinicmanager/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <Layout><div className={styles.loading}>Loading analytics...</div></Layout>;

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Plan Analytics</h1>
          <p>Subscription distributions and total revenue overview.</p>
        </div>

        <div className={styles.bentoGrid}>
          <div className={styles.statTile}>
            <div className={`${styles.statIcon} ${styles.green}`}>💰</div>
            <div>
              <div className={styles.statLabel}>Total Revenue Generated</div>
              <div className={styles.statValue}>${data.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Health Plan Subscribers</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Total Subscribers</th>
              </tr>
            </thead>
            <tbody>
              {data.planDistribution.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.PlanName}</strong></td>
                  <td>{p.Subscribers} Users</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
