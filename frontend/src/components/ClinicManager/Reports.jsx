import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './ManagerPages.module.css';

const API = 'http://localhost:8080';

const Reports = () => {
  const [reports, setReports] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/clinicmanager/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setReports(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!reports) return <Layout><div className={styles.loading}>Loading reports...</div></Layout>;

  const { revenueByType, appointmentsByStatus } = reports;

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Clinic Reports</h1>
          <p>Financial and operational reporting.</p>
        </div>

        <div className={styles.bentoGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Revenue by Treatment Type</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Total Billed</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {revenueByType?.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.Type || r.type}</strong></td>
                    <td>${Number(r.TotalRevenue || r.totalRevenue).toFixed(2)}</td>
                    <td>{r.Count || r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Appointment Status Distribution</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {appointmentsByStatus?.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`${styles.badge} ${a.Status === 'Completed' || a.status === 'Completed' ? styles.good : styles.low}`}>
                        {a.Status || a.status}
                      </span>
                    </td>
                    <td>{a.Count || a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
