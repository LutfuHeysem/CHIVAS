import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../Layout/Layout';
import hp from './HealthPlans.module.css';

const API = 'http://localhost:8080';

const EMPTY_FORM = { name: '', monthlyFee: '', discountRate: '', planType: '' };

const Analytics = () => {
  const [plans, setPlans] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // null = create mode

  const token = localStorage.getItem('chivas_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/clinicmanager/analytics`, { headers }),
      axios.get(`${API}/api/clinicmanager/marketing-targets`, { headers }),
    ])
      .then(([plansRes, targetsRes]) => {
        setPlans(plansRes.data);
        setTargets(targetsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEdit = (plan) => {
    setEditingId(plan.planId);
    setForm({
      name: plan.planName,
      monthlyFee: plan.monthlyFee,
      discountRate: plan.discountRate,
      planType: plan.planType || '',
    });
    document.getElementById('plan-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      monthlyFee: parseFloat(form.monthlyFee),
      discountRate: parseFloat(form.discountRate),
      planType: form.planType,
    };
    const request = editingId
      ? axios.put(`${API}/api/clinicmanager/healthplans/${editingId}`, payload, { headers })
      : axios.post(`${API}/api/clinicmanager/healthplans`, payload, { headers });

    request
      .then(() => { handleCancel(); fetchAll(); })
      .catch(err => alert(err.response?.data?.message || 'An error occurred'));
  };

  const totalSubscribers = plans.reduce((s, p) => s + Number(p.subscriberCount), 0);
  const totalRevenue = plans.reduce((s, p) => s + Number(p.monthlyRevenue), 0);

  const rankLabel = (rank) => {
    if (rank === 1) return <span className={hp.rankGold}>#{rank}</span>;
    if (rank === 2) return <span className={hp.rankSilver}>#{rank}</span>;
    return <span className={hp.rankBronze}>#{rank}</span>;
  };

  return (
    <Layout>
      {/* ── Header ── */}
      <div className={hp.pageHeader}>
        <div>
          <h2 className={hp.pageTitle}>📊 Health Plan Analytics</h2>
          <p className={hp.pageSubtitle}>Manage premium plans and view real-time subscriber statistics.</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className={hp.summaryRow}>
        <div className={hp.summaryCard}>
          <div className={hp.summaryIcon}>👥</div>
          <div>
            <div className={hp.summaryLabel}>Total Subscribers</div>
            <div className={hp.summaryValue}>{loading ? '—' : totalSubscribers}</div>
          </div>
        </div>
        <div className={hp.summaryCard} style={{ borderLeftColor: '#10b981' }}>
          <div className={hp.summaryIcon}>💰</div>
          <div>
            <div className={hp.summaryLabel}>Monthly Revenue</div>
            <div className={hp.summaryValue}>{loading ? '—' : `$${totalRevenue.toFixed(2)}`}</div>
          </div>
        </div>
        <div className={hp.summaryCard} style={{ borderLeftColor: '#f59e0b' }}>
          <div className={hp.summaryIcon}>📋</div>
          <div>
            <div className={hp.summaryLabel}>Active Plans</div>
            <div className={hp.summaryValue}>{loading ? '—' : plans.length}</div>
          </div>
        </div>
      </div>

      {/* ── Active Plans Table ── */}
      <div className={hp.section}>
        <div className={hp.sectionTitle}>Active Health Plans Overview</div>
        {loading ? <p>Loading…</p> : (
          <table className={hp.table}>
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Monthly Fee</th>
                <th>Discount Rate</th>
                <th>Plan Type</th>
                <th>Total Subscribers</th>
                <th>Monthly Revenue</th>
                <th>Popularity Rank</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.planId}>
                  <td><strong>{plan.planName}</strong></td>
                  <td>${Number(plan.monthlyFee).toFixed(2)}</td>
                  <td>{Number(plan.discountRate).toFixed(1)}%</td>
                  <td><span className={hp.typeBadge}>{plan.planType}</span></td>
                  <td>{plan.subscriberCount}</td>
                  <td className={hp.revenue}>${Number(plan.monthlyRevenue).toFixed(2)}</td>
                  <td>{rankLabel(Number(plan.popularityRank))}</td>
                  <td>
                    <button className={hp.editBtn} onClick={() => handleEdit(plan)}>✏️ Edit</button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan="8" className={hp.empty}>No health plans found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create / Update Form ── */}
      <div className={hp.section} id="plan-form">
        <div className={hp.sectionTitle}>{editingId ? '✏️ Update Health Plan' : '➕ Create New Health Plan'}</div>
        <form className={hp.form} onSubmit={handleSubmit}>
          <div className={hp.formGrid}>
            <div className={hp.formGroup}>
              <label>Plan Name</label>
              <input
                type="text"
                placeholder="e.g. Premium Plus"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className={hp.formGroup}>
              <label>Monthly Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 150.00"
                value={form.monthlyFee}
                onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value }))}
                required
              />
            </div>
            <div className={hp.formGroup}>
              <label>Discount Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 15.00"
                value={form.discountRate}
                onChange={e => setForm(f => ({ ...f, discountRate: e.target.value }))}
                required
              />
            </div>
            <div className={hp.formGroup}>
              <label>Plan Type</label>
              <input
                type="text"
                placeholder="e.g. Standard, Premium"
                value={form.planType}
                onChange={e => setForm(f => ({ ...f, planType: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={hp.formActions}>
            {editingId && (
              <button type="button" className={hp.cancelBtn} onClick={handleCancel}>Cancel</button>
            )}
            <button type="submit" className={hp.saveBtn}>
              {editingId ? '✓ Update' : '✓ Save'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Marketing Targets ── */}
      <div className={hp.section}>
        <div className={hp.sectionTitle}>🎯 Marketing Targets: High Spenders (Unsubscribed)</div>
        <p className={hp.sectionDesc}>Pet owners with no health plan who have paid over $1,500 in total bills.</p>
        {loading ? <p>Loading…</p> : (
          <table className={hp.table}>
            <thead>
              <tr>
                <th>Owner Name</th>
                <th>Email</th>
                <th>Total Spent (Paid)</th>
              </tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.personId}>
                  <td>{t.firstName} {t.surname}</td>
                  <td>{t.email}</td>
                  <td className={hp.revenue}>${Number(t.totalSpent).toFixed(2)}</td>
                </tr>
              ))}
              {targets.length === 0 && (
                <tr><td colSpan="3" className={hp.empty}>No high-spender targets found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
