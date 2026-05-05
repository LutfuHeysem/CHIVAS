import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import MyPets from './components/MyPets/MyPets';
import BookAppointment from './components/Appointments/BookAppointment';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-pets" element={<MyPets />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/" element={
          localStorage.getItem('chivas_token') ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
