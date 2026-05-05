import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import MyPets from './components/MyPets/MyPets';
import BookAppointment from './components/Appointments/BookAppointment';
import PatientRecords from './components/Veterinarian/PatientRecords';
import Vaccinations from './components/Veterinarian/Vaccinations';
import Schedule from './components/Veterinarian/Schedule';
import Patients from './components/Veterinarian/Patients';
import Referrals from './components/Veterinarian/Referrals';
import MedicalHistory from './components/MedicalHistory/MedicalHistory';
import Bills from './components/Bills/Bills';
import HealthPlans from './components/HealthPlans/HealthPlans';

import CompleteAppointment from './components/Veterinarian/CompleteAppointment';

import Analytics from './components/ClinicManager/Analytics';
import Inventory from './components/ClinicManager/Inventory';
import Staff from './components/ClinicManager/Staff';
import Reports from './components/ClinicManager/Reports';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-pets" element={<MyPets />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/medical-history" element={<MedicalHistory />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/health-plans" element={<HealthPlans />} />
        <Route path="/" element={
          localStorage.getItem('chivas_token') ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
        {/* Vet pages */}
        <Route path="/vet/schedule" element={<Schedule />} />
        <Route path="/vet/records" element={<PatientRecords />} />
        <Route path="/vet/patients" element={<Patients />} />
        <Route path="/vet/vaccinations" element={<Vaccinations />} />
        <Route path="/vet/referrals" element={<Referrals />} />
        <Route path="/vet/complete/:appointmentId" element={<CompleteAppointment />} />
        
        {/* Manager pages */}
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/reports" element={<Reports />} />
        
        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
