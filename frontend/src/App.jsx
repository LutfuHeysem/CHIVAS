import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import PatientRecords from './components/Veterinarian/PatientRecords';
import Vaccinations from './components/Veterinarian/Vaccinations';
import Schedule from './components/Veterinarian/Schedule';
import Patients from './components/Veterinarian/Patients';
import Referrals from './components/Veterinarian/Referrals';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Vet pages */}
        <Route path="/vet/schedule" element={<Schedule />} />
        <Route path="/vet/records" element={<PatientRecords />} />
        <Route path="/vet/prescriptions" element={<PatientRecords />} />
        <Route path="/vet/patients" element={<Patients />} />
        <Route path="/vet/vaccinations" element={<Vaccinations />} />
        <Route path="/vet/referrals" element={<Referrals />} />
        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
