import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import styles from './Bills.module.css';

const API = 'http://localhost:8080';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Unpaid');
  const navigate = useNavigate();

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('chivas_token');
      const res = await axios.get(`${API}/api/bills/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(res.data);
    } catch (err) {
      console.error('Failed to fetch bills', err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePay = async (billId, amount) => {
    if (!window.confirm(`Are you sure you want to pay $${amount} for this bill?`)) return;

    try {
      const token = localStorage.getItem('chivas_token');
      await axios.post(`${API}/api/bills/${billId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBills();
    } catch (err) {
      alert(err.response?.data || 'Failed to pay bill');
      console.error(err);
    }
  };

  const filteredBills = bills.filter(b => b.status === activeTab);

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bills & Payments</h1>
          <p className={styles.subtitle}>Manage your clinic invoices and outstanding balances.</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'Unpaid' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('Unpaid')}
          >
            Unpaid ({bills.filter(b => b.status === 'Unpaid').length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'Paid' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('Paid')}
          >
            Paid ({bills.filter(b => b.status === 'Paid').length})
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading your bills...</div>
        ) : filteredBills.length === 0 ? (
          <div className={styles.empty}>You have no {activeTab.toLowerCase()} bills.</div>
        ) : (
          <div className={styles.billList}>
            {filteredBills.map(bill => (
              <div key={bill.billId} className={styles.billCard}>
                <div className={styles.billIcon}>
                  {bill.status === 'Paid' ? '✅' : '🧾'}
                </div>
                
                <div className={styles.billDetails}>
                  <div className={styles.billHeader}>
                    <h3>{bill.procedureName || 'Veterinary Services'}</h3>
                    <div className={styles.amount}>${bill.amount}</div>
                  </div>
                  
                  <div className={styles.billInfo}>
                    <span><strong>Pet:</strong> {bill.petName}</span>
                    <span className={styles.dot}>•</span>
                    <span><strong>Vet:</strong> Dr. {bill.vetFirstName} {bill.vetSurname}</span>
                    <span className={styles.dot}>•</span>
                    <span><strong>Date:</strong> {bill.appointmentDate}</span>
                  </div>

                  {bill.status === 'Paid' && (
                    <div className={styles.paidDate}>
                      Paid on: {bill.paymentDate}
                    </div>
                  )}
                </div>

                {bill.status === 'Unpaid' && (
                  <div className={styles.billAction}>
                    <button 
                      className={styles.payBtn}
                      onClick={() => handlePay(bill.billId, bill.amount)}
                    >
                      Pay Now
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Bills;
