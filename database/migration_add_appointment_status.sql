-- Migration: Add status column to Appointment table
ALTER TABLE Appointment
ADD COLUMN status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled';
