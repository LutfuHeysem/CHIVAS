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

-- Insert Appointment
INSERT INTO Appointment (date, time, procedure_name, follow_up_notes, pet_id, vet_id) VALUES 
('2026-05-10', '10:00:00', 'General Checkup', 'Looks healthy', 1, 1);

-- Note: Other procedures and triggers can be tested manually using this seeded data.
