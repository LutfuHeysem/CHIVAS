import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

const ROLE_LABELS = {
  PetOwner: 'Pet Owner',
  Veterinarian: 'Veterinarian',
  ClinicManager: 'Clinic Manager',
};

const NAV = {
  PetOwner: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '🐾', label: 'My Pets', path: '/my-pets' },
    { icon: '📅', label: 'Book Appointment', path: '/book-appointment' },
    { icon: '📋', label: 'Medical History', path: '/medical-history' },
    { icon: '💳', label: 'Bills', path: '/bills' },
    { icon: '🛡️', label: 'Health Plans', path: '/health-plans' },
  ],
  Veterinarian: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📋', label: 'Schedule', path: '/schedule' },
    { icon: '🗂️', label: 'Patient Records', path: '/patient-records' },
    { icon: '💊', label: 'Prescriptions', path: '/prescriptions' },
    { icon: '💉', label: 'Vaccinations', path: '/vaccinations' },
    { icon: '🔄', label: 'Referrals', path: '/referrals' },
  ],
  ClinicManager: [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📊', label: 'Plan Analytics', path: '/analytics' },
    { icon: '📦', label: 'Stock & Waste', path: '/inventory' },
    { icon: '👥', label: 'Staff', path: '/staff' },
    { icon: '📄', label: 'Reports', path: '/reports' },
  ],
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem('chivas_role') || 'PetOwner';
  const userName = localStorage.getItem('chivas_user');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = NAV[role] || NAV.PetOwner;

  return (
    <div className={`page-enter ${styles.layout}`}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>🐾</span> CHIVAS
          </div>
          <nav className={styles.nav}>
            {navItems.map(n => (
              <button
                key={n.label}
                onClick={() => navigate(n.path)}
                className={`${styles.navItem} ${location.pathname === n.path ? styles.active : ''}`}
              >
                <span className={styles.navEmoji}>{n.icon}</span> {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{userName?.charAt(0) || 'U'}</div>
            <div>
              <div className={styles.userName}>{userName || 'User'}</div>
              <div className={styles.userRole}>{ROLE_LABELS[role] || role}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
