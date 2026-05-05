import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css';
import Layout from '../Layout/Layout';

const API = 'http://localhost:8080';

const ROLE_LABELS = {
  PetOwner: 'Pet Owner',
  Veterinarian: 'Veterinarian',
  ClinicManager: 'Clinic Manager',
};



/* ════════════ SHELL ════════════ */
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const role = localStorage.getItem('chivas_role');
  const userName = localStorage.getItem('chivas_user');

  useEffect(() => {
    const token = localStorage.getItem('chivas_token');
    if (!token) { navigate('/login'); return; }

    axios.get(`${API}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Dashboard fetch failed', err);
        if (err.response?.status === 401) navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Layout>
      <div className={styles.heroBanner}>
        <div className={styles.heroGreeting}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userName} 👋
        </div>
        <div className={styles.heroSub}>
          Here's what's happening in your {ROLE_LABELS[role] || ''} dashboard today.
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.emptyState}>Loading your dashboard…</div>
        ) : !data ? (
          <div className={styles.emptyState}>Could not load dashboard data.</div>
        ) : (
          <>
            {role === 'Veterinarian' && <VetView data={data} />}
            {role === 'PetOwner' && <OwnerView data={data} />}
            {role === 'ClinicManager' && <ManagerView data={data} />}
          </>
        )}
      </div>
    </Layout>
  );
};

/* ════════════ VET ════════════ */
const VetView = ({ data }) => {
  const { stats, todaysSchedule } = data;
  return (
    <>
      {/* Stats */}
      <div className={styles.bentoGrid}>
        <Stat icon="📋" color="green" label="Today's Patients" value={stats.todaysAppointments} />
        <Stat icon="📅" color="warm" label="Upcoming" value={stats.upcomingAppointments} />
        <Stat icon="🐾" color="sky" label="Unique Patients" value={stats.totalUniquePatients} />
      </div>

      {/* Quick Actions */}
      <div className={styles.sectionLabel}>Quick Actions</div>
      <div className={styles.quickGrid}>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>📝</span>Write Prescription</button>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>💉</span>New Vaccination Plan</button>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>🔄</span>Create Referral</button>
      </div>

      {/* Schedule + Features */}
      <div className={styles.twoCol}>
        <div className={styles.schedulePanel}>
          <div className={styles.scheduleTitle}>Today's Schedule</div>
          <div className={styles.scheduleSub}>
            {todaysSchedule.length} appointment{todaysSchedule.length !== 1 ? 's' : ''} today
          </div>
          {todaysSchedule.length === 0 ? (
            <div className={styles.emptyState}>No patients scheduled today — enjoy your break! 🎉</div>
          ) : (
            <div className={styles.timeline}>
              {todaysSchedule.map(a => (
                <div key={a.appntmId} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTime}>{a.time}</div>
                    <div className={styles.timelinePet}>{a.petName} ({a.species})</div>
                    <div className={styles.timelineDetail}>Owner: {a.ownerName} · {a.procedureName || 'General checkup'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.featureLinks}>
          <Feature icon="📋" color="blue" title="Full Schedule" desc="View all upcoming appointments and history." />
          <Feature icon="🗂️" color="green" title="Patient Records" desc="Search pet histories, diagnoses, and prescriptions." />
          <Feature icon="💉" color="warm" title="Vaccinations" desc="Manage vaccination plans and follow-up items." />
          <Feature icon="🔄" color="gold" title="Referrals" desc="Open referral cases from other veterinarians." />
        </div>
      </div>
    </>
  );
};

/* ════════════ OWNER ════════════ */
const OwnerView = ({ data }) => {
  const navigate = useNavigate();
  const { stats, pets, upcomingAppointments } = data;
  return (
    <>
      <div className={styles.bentoGrid}>
        <Stat icon="🐾" color="green" label="My Pets" value={stats.totalPets} />
        <Stat icon="📅" color="warm" label="Upcoming Visits" value={stats.upcomingAppointmentCount} />
        <Stat icon="📋" color="sky" label="Total Visits" value={stats.totalAppointments} />
      </div>

      <div className={styles.sectionLabel}>Quick Actions</div>
      <div className={styles.quickGrid}>
        <button className={styles.quickBtn} onClick={() => navigate('/book-appointment')}><span className={styles.quickBtnIcon}>📅</span>Book Appointment</button>
        <button className={styles.quickBtn} onClick={() => navigate('/my-pets')}><span className={styles.quickBtnIcon}>🐾</span>Add New Pet</button>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>💳</span>Pay Outstanding Bill</button>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.schedulePanel}>
          <div className={styles.scheduleTitle}>Upcoming Appointments</div>
          <div className={styles.scheduleSub}>Your next scheduled visits</div>
          {upcomingAppointments.length === 0 ? (
            <div className={styles.emptyState}>No upcoming appointments — book one today!</div>
          ) : (
            <div className={styles.timeline}>
              {upcomingAppointments.map(a => (
                <div key={a.appntmId} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTime}>{a.date} · {a.time}</div>
                    <div className={styles.timelinePet}>{a.petName}</div>
                    <div className={styles.timelineDetail}>Dr. {a.vetName} · {a.procedureName || 'Checkup'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.featureLinks}>
          <Feature onClick={() => navigate('/my-pets')} icon="🐾" color="green" title="My Pets" desc="View pet profiles, health records, and vaccinations." />
          <Feature icon="📋" color="blue" title="Medical History" desc="Timeline of past visits, diagnoses, and treatments." />
          <Feature icon="💳" color="gold" title="Bills & Payments" desc="View invoices and health plan discounts." />
          <Feature icon="🛡️" color="warm" title="Health Plans" desc="Compare plans and upgrade for better coverage." />
        </div>
      </div>
    </>
  );
};

/* ════════════ MANAGER ════════════ */
const ManagerView = ({ data }) => {
  const { stats, recentAppointments } = data;
  return (
    <>
      <div className={styles.bentoGrid}>
        <Stat icon="🩺" color="green" label="Veterinarians" value={stats.totalVeterinarians} />
        <Stat icon="👤" color="warm" label="Pet Owners" value={stats.totalPetOwners} />
        <Stat icon="🐾" color="sky" label="Registered Pets" value={stats.totalPets} />
      </div>

      <div className={styles.bentoGrid} style={{ marginTop: 0 }}>
        <Stat icon="📋" color="gold" label="Total Appointments" value={stats.totalAppointments} />
        <Stat icon="📅" color="green" label="Today's Appointments" value={stats.todaysAppointments} />
      </div>

      <div className={styles.sectionLabel}>Quick Actions</div>
      <div className={styles.quickGrid}>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>👥</span>Manage Staff</button>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>📦</span>Check Inventory</button>
        <button className={styles.quickBtn}><span className={styles.quickBtnIcon}>📄</span>Generate Report</button>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.schedulePanel}>
          <div className={styles.scheduleTitle}>Recent Activity</div>
          <div className={styles.scheduleSub}>Latest appointments across all branches</div>
          {recentAppointments.length === 0 ? (
            <div className={styles.emptyState}>No activity yet.</div>
          ) : (
            <div className={styles.timeline}>
              {recentAppointments.map(a => (
                <div key={a.appntmId} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTime}>{a.date} · {a.time}</div>
                    <div className={styles.timelinePet}>{a.petName}</div>
                    <div className={styles.timelineDetail}>Dr. {a.vetName} · {a.procedureName || 'Consultation'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.featureLinks}>
          <Feature icon="📊" color="blue" title="Plan Analytics" desc="Subscriber stats and marketing targets." />
          <Feature icon="📦" color="green" title="Stock & Waste" desc="Inventory levels, expiry dates, and waste logs." />
          <Feature icon="👥" color="warm" title="Staff Management" desc="Vet profiles, branch assignments, and ratings." />
          <Feature icon="📄" color="berry" title="Reports" desc="Export performance and financial reports." />
        </div>
      </div>
    </>
  );
};

/* ════════════ SHARED COMPONENTS ════════════ */
const Stat = ({ icon, color, label, value }) => (
  <div className={styles.statTile}>
    <div className={`${styles.statTileIcon} ${styles[color]}`}>{icon}</div>
    <div className={styles.statTileInfo}>
      <div className={styles.statTileLabel}>{label}</div>
      <div className={String(value).length > 6 ? styles.statTileValueSmall : styles.statTileValue}>
        {value}
      </div>
    </div>
  </div>
);

const Feature = ({ icon, color, title, desc, onClick }) => (
  <button className={styles.featureLink} onClick={onClick}>
    <div className={`${styles.featureLinkIcon} ${styles[color]}`}>{icon}</div>
    <div className={styles.featureLinkText}>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
    <span className={styles.featureLinkArrow}>→</span>
  </button>
);

export default Dashboard;
