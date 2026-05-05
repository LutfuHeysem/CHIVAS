-- CHIVAS Dummy Data Seed

-- Insert Persons
INSERT INTO Person (first_name, second_name, surname, email, password) VALUES 
('Ahmet', NULL, 'Yilmaz', 'ahmet@example.com', 'pass123'),
('Ayse', 'Nur', 'Kaya', 'ayse@example.com', 'pass123'),
('Mehmet', NULL, 'Demir', 'mehmet@example.com', 'pass123'),
('Fatma', NULL, 'Celik', 'fatma@example.com', 'pass123');

-- Insert Staff & Roles
INSERT INTO Staff (staff_id, salary) VALUES 
(1, 15000.00), -- Ahmet (Vet)
(2, 20000.00); -- Ayse (Manager)

INSERT INTO Veterinarian (vet_id, specialty, species_expertise) VALUES 
(1, 'Surgery', 'Dogs and Cats');

INSERT INTO Clinic_Manager (manager_id) VALUES 
(2);

-- Insert Clinics & Branches
INSERT INTO Clinic (specialty) VALUES ('General Veterinary');
INSERT INTO Branch (location, address, clinic_id, manager_id) VALUES 
('Ankara', 'Cankaya', 1, 2);

-- Insert Health Plans
INSERT INTO Health_Plan (name, monthly_fee, discount_rate, plan_type) VALUES 
('Basic', 100.00, 10.00, 'Standard'),
('Premium', 250.00, 25.00, 'Premium');

-- Insert Pet Owners
INSERT INTO Pet_Owner (owner_id, balance, plan_id) VALUES 
(3, 0.00, 1), -- Mehmet
(4, 500.00, 2); -- Fatma (Has debt later)

-- Insert Pets
INSERT INTO Pet (name, species, breed, allergies, sex, age, owner_id) VALUES 
('Karabas', 'Dog', 'Kangal', 'None', 'Male', 3, 3),
('Minnoş', 'Cat', 'Tekir', 'Dust', 'Female', 2, 4);

-- Insert Medicine
INSERT INTO Medicine (name, category, expiration_date) VALUES 
('Painkiller', 'Analgesic', '2028-12-31'),
('Antibiotic X', 'Antibiotic', '2027-06-30');

-- Stock Medicine in Branch
INSERT INTO Branch_Stock (branch_id, med_id, stock_amount) VALUES 
(1, 1, 50),
(1, 2, 20);

-- Insert Appointments
INSERT INTO Appointment (appntm_id, date, time, procedure_name, follow_up_notes, pet_id, vet_id, status) VALUES 
(1, CURDATE(), '10:00:00', 'General Checkup', 'Pending checkup', 1, 1, 'Scheduled'),
(2, '2025-10-15', '14:30:00', 'Annual Checkup', 'Dog is healthy', 1, 1, 'Completed'),
(3, '2026-01-20', '09:15:00', 'Dental Cleaning', 'Slight plaque buildup', 1, 1, 'Completed'),
(4, '2026-04-05', '11:00:00', 'Flea Treatment', 'Apply drops monthly', 2, 1, 'Completed'),
(5, CURDATE(), '14:00:00', 'Vaccination', 'Needs rabies shot', 2, 1, 'Scheduled'),
(6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', 'Surgery Consult', 'Check leg', 1, 1, 'Scheduled'),
(7, '2026-03-10', '16:00:00', 'Grooming', 'Cancelled by owner', 2, 1, 'Cancelled');

-- Insert Diagnoses
INSERT INTO Diagnosis (type, symptoms, appntm_id) VALUES
('Healthy', 'None', 2),
('Gingivitis', 'Plaque and bad breath', 3),
('Flea Infestation', 'Scratching', 4);

-- Insert Bills
INSERT INTO Bill (type, amount, status, payment_date, appntm_id) VALUES 
('Consultation', 150.00, 'Paid', '2025-10-15', 2),
('Surgery', 450.00, 'Unpaid', NULL, 3),
('Pharmacy', 75.00, 'Unpaid', NULL, 4);

-- Insert Ratings
INSERT INTO Rating (score, comment, owner_id, vet_id, appntm_id) VALUES 
(5, 'Dr. Ahmet was very gentle with Karabas!', 3, 1, 2);

-- Insert Vaccines and Plans
INSERT INTO Vaccine (vaccine_id, type, cycle_protocol) VALUES 
(1, 'Rabies', '1 Year'),
(2, 'Distemper', '3 Years'),
(3, 'Parvovirus', '1 Year');

INSERT INTO Vaccination_Plan (plan_id, creation_date, pet_id, vet_id) VALUES 
(1, '2025-10-15', 1, 1),
(2, '2026-04-05', 2, 1);

INSERT INTO Plan_Vaccine (plan_id, vaccine_id, planned_date, status, dose_number) VALUES 
(1, 1, '2025-10-15', 'Administered', 1),
(1, 1, '2026-10-15', 'Pending', 2),
(1, 2, '2025-10-15', 'Administered', 1),
(1, 3, '2026-05-01', 'Missed', 1),
(2, 2, '2026-04-05', 'Administered', 1);
