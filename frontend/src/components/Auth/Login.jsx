import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('chivas_token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [branches, setBranches] = useState([]);

  React.useEffect(() => {
    axios.get('http://localhost:8080/api/auth/branches')
      .then(res => setBranches(res.data))
      .catch(err => console.error('Could not load branches', err));
  }, []);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regFirstName, setRegFirstName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('PetOwner');
  const [regBranchId, setRegBranchId] = useState('');
  const [regNewBranchLocation, setRegNewBranchLocation] = useState('');
  const [regNewBranchAddress, setRegNewBranchAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Password Validations
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(regPassword);
  const hasMinLength = regPassword.length >= 6;
  const passwordsMatch = regPassword === regConfirmPassword && regPassword.length > 0;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      const { token, role: returnedRole, firstName } = response.data;
      localStorage.setItem('chivas_token', token);
      localStorage.setItem('chivas_role', returnedRole);
      localStorage.setItem('chivas_user', firstName);
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.response?.data || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasUppercase || !hasSpecialChar || !hasMinLength || !passwordsMatch) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    if (regRole !== 'PetOwner' && !regBranchId) {
      setError('Please select a branch.');
      return;
    }

    if (regRole === 'ClinicManager' && regBranchId === 'new') {
      if (!regNewBranchLocation || !regNewBranchAddress) {
        setError('Please provide the location and address for the new branch.');
        return;
      }
    }

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        firstName: regFirstName,
        surname: regSurname,
        email: regEmail,
        password: regPassword,
        role: regRole,
        branchId: regRole !== 'PetOwner' && regBranchId !== 'new' ? parseInt(regBranchId) : null,
        newBranchLocation: regRole === 'ClinicManager' && regBranchId === 'new' ? regNewBranchLocation : null,
        newBranchAddress: regRole === 'ClinicManager' && regBranchId === 'new' ? regNewBranchAddress : null
      });

      const { token, role: returnedRole, firstName } = response.data;
      localStorage.setItem('chivas_token', token);
      localStorage.setItem('chivas_role', returnedRole);
      localStorage.setItem('chivas_user', firstName);
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className={`page-enter ${styles.container}`}>
      {/* Left Panel */}
      <div className={styles.authSide}>
        <div>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>🐾</div>
            <div>CHIVAS</div>
          </div>
          <h1 className={styles.tagline}>
            The <i>modern</i> solution for your veterinary clinic.
          </h1>
        </div>
        
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <p>Easily manage and track your appointments.</p>
          </div>
          <div className={styles.featureCard}>
            <p>Instantly access patient medical history.</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.authFormWrap}>
        <div className={styles.formContainer}>
          
          <div className={styles.tabSwitcher}>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'login' ? styles.active : ''}`}
              onClick={() => { setActiveTab('login'); setError(''); }}
            >
              Log in
            </button>
            <button 
              type="button"
              className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`}
              onClick={() => { setActiveTab('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="example@email.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Log in
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className={styles.roleSelection}>
                <button
                  type="button"
                  className={`${styles.roleCard} ${regRole === 'PetOwner' ? styles.active : ''}`}
                  onClick={() => setRegRole('PetOwner')}
                >
                  <span className={styles.roleIcon}>🐾</span>
                  Pet Owner
                </button>
                <button
                  type="button"
                  className={`${styles.roleCard} ${regRole === 'Veterinarian' ? styles.active : ''}`}
                  onClick={() => setRegRole('Veterinarian')}
                >
                  <span className={styles.roleIcon}>🩺</span>
                  Veterinarian
                </button>
                <button
                  type="button"
                  className={`${styles.roleCard} ${regRole === 'ClinicManager' ? styles.active : ''}`}
                  onClick={() => setRegRole('ClinicManager')}
                >
                  <span className={styles.roleIcon}>📊</span>
                  Manager
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input type="text" placeholder="John" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} required />
                </div>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label>Surname</label>
                  <input type="text" placeholder="Doe" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} required />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input type="email" placeholder="example@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              </div>

              {regRole !== 'PetOwner' && (
                <>
                  <div className={styles.inputGroup}>
                    <label>Assign to Branch</label>
                    <select 
                      value={regBranchId} 
                      onChange={e => setRegBranchId(e.target.value)}
                      required
                      style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    >
                      <option value="" disabled>Select a branch...</option>
                      {branches.map(b => (
                        <option key={b.branchId} value={b.branchId}>{b.location} - {b.address}</option>
                      ))}
                      {regRole === 'ClinicManager' && (
                        <option value="new" style={{ fontWeight: 'bold' }}>+ Add New Branch</option>
                      )}
                    </select>
                  </div>

                  {regRole === 'ClinicManager' && regBranchId === 'new' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                      <div className={styles.inputGroup}>
                        <label>New Branch Location</label>
                        <input type="text" placeholder="e.g. Istanbul" value={regNewBranchLocation} onChange={e => setRegNewBranchLocation(e.target.value)} required />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>New Branch Address</label>
                        <input type="text" placeholder="Full address..." value={regNewBranchAddress} onChange={e => setRegNewBranchAddress(e.target.value)} required />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className={styles.inputGroup}>
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              </div>

              <div className={styles.inputGroup}>
                <label>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
              </div>

              <ul style={{ fontSize: '12px', color: 'var(--ink-500)', paddingLeft: '20px', marginBottom: '20px' }}>
                <li style={{ color: hasMinLength ? 'var(--ok)' : 'inherit' }}>At least 6 characters</li>
                <li style={{ color: hasUppercase ? 'var(--ok)' : 'inherit' }}>One uppercase letter</li>
                <li style={{ color: hasSpecialChar ? 'var(--ok)' : 'inherit' }}>One special character (!@#$%^&*)</li>
                <li style={{ color: passwordsMatch ? 'var(--ok)' : 'inherit' }}>Passwords match</li>
              </ul>

              <button type="submit" className={styles.submitBtn}>
                Create Account
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
