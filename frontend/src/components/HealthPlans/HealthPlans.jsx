import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Layout';
import styles from './HealthPlans.module.css';

const API = 'http://localhost:8080';

const HealthPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('chivas_token');
      const res = await axios.get(`${API}/api/healthplans/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch health plans', err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId, planName, fee) => {
    if (!window.confirm(`Are you sure you want to subscribe to the ${planName} plan? The monthly fee of $${fee} will be deducted from your clinic balance.`)) return;
    
    try {
      const token = localStorage.getItem('chivas_token');
      await axios.post(`${API}/api/healthplans/subscribe/${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Successfully subscribed to ${planName}!`);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data || 'Failed to subscribe to the plan');
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Premium Health Plans</h1>
          <p className={styles.subtitle}>Protect your pets and enjoy exclusive clinic discounts.</p>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.empty}>Loading health plans...</div>
        ) : plans.length === 0 ? (
          <div className={styles.empty}>No health plans are currently available.</div>
        ) : (
          <div className={styles.grid}>
            {plans.map(plan => (
              <div 
                key={plan.planId} 
                className={`${styles.card} ${plan.subscriptionStatus === 'Current Plan' ? styles.currentCard : ''}`}
              >
                {plan.subscriptionStatus === 'Current Plan' && (
                  <div className={styles.badge}>Your Current Plan</div>
                )}
                
                <div className={styles.cardHeader}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>{plan.monthlyFee}</span>
                    <span className={styles.period}>/mo</span>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  <ul className={styles.features}>
                    <li>
                      <span className={styles.check}>✓</span> 
                      <strong>{plan.discountRate}%</strong> discount on all treatments
                    </li>
                    <li>
                      <span className={styles.check}>✓</span> 
                      Priority appointment booking
                    </li>
                    <li>
                      <span className={styles.check}>✓</span> 
                      24/7 emergency hotline access
                    </li>
                  </ul>
                  
                  {plan.subscriptionStatus === 'Current Plan' ? (
                    <button className={styles.activeBtn} disabled>Active Subscription</button>
                  ) : (
                    <button 
                      className={styles.subscribeBtn} 
                      onClick={() => handleSubscribe(plan.planId, plan.name, plan.monthlyFee)}
                    >
                      Subscribe Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HealthPlans;
