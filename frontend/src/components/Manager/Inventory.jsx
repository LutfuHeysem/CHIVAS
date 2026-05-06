import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import styles from './Manager.module.css'; // Shared CSS for manager components

const API = 'http://localhost:8080';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('stock'); // 'stock' or 'waste'
  const [selectedMed, setSelectedMed] = useState(null);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');

  const fetchInventory = () => {
    setLoading(true);
    const token = localStorage.getItem('chivas_token');
    axios.get(`${API}/api/clinicmanager/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setInventory(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openModal = (med, type) => {
    setSelectedMed(med);
    setModalType(type);
    setAmount(1);
    setReason('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('chivas_token');
    const endpoint = modalType === 'stock' ? 'stock' : 'waste';
    const payload = modalType === 'stock' 
      ? { medId: selectedMed.medId, amount: parseInt(amount) }
      : { medId: selectedMed.medId, amount: parseInt(amount), reason };

    axios.post(`${API}/api/clinicmanager/inventory/${endpoint}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setShowModal(false);
        fetchInventory();
      })
      .catch(err => alert(err.response?.data || 'An error occurred'));
  };

  return (
    <Layout>
      <div className={styles.header}>
        <h2>📦 Stock & Waste Management</h2>
        <p>Monitor inventory levels, add stock, and log medical waste.</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Expiration Date</th>
                <th>Stock Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.medId}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.expirationDate}</td>
                  <td>
                    <span className={item.stockAmount < 10 ? styles.lowStock : styles.goodStock}>
                      {item.stockAmount}
                    </span>
                  </td>
                  <td>
                    <button className={styles.btnPrimary} onClick={() => openModal(item, 'stock')}>+ Add</button>
                    <button className={styles.btnDanger} onClick={() => openModal(item, 'waste')}>- Waste</button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles.textCenter}>No inventory items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{modalType === 'stock' ? 'Add Stock' : 'Log Waste'} for {selectedMed?.name}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input 
                  type="number" 
                  min="1"
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                />
              </div>
              {modalType === 'waste' && (
                <div className={styles.formGroup}>
                  <label>Reason for Waste</label>
                  <textarea 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    required 
                  />
                </div>
              )}
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={modalType === 'stock' ? styles.btnPrimary : styles.btnDanger}>
                  {modalType === 'stock' ? 'Add Stock' : 'Log Waste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Inventory;
