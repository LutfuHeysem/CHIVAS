import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './ManagerPages.module.css';

const API = 'http://localhost:8080';

const Inventory = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/clinicmanager/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!items.length) return <Layout><div className={styles.loading}>Loading inventory...</div></Layout>;

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Stock & Waste</h1>
          <p>Monitor branch inventory and expiration dates.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Current Medicine Inventory</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Expiration Date</th>
                <th>Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.category}</td>
                  <td>{item.expirationDate}</td>
                  <td>
                    <span className={`${styles.badge} ${item.stockAmount < 30 ? styles.low : styles.good}`}>
                      {item.stockAmount} units
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

export default Inventory;
