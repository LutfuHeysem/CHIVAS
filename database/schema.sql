-- CHIVAS Database Schema

-- Drop tables if they exist to allow clean re-runs
DROP TABLE IF EXISTS Branch_Stock;
DROP TABLE IF EXISTS Waste;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Report;
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS Referral;
DROP TABLE IF EXISTS Prescription_Medicine;
DROP TABLE IF EXISTS Medicine;
DROP TABLE IF EXISTS Prescription;
DROP TABLE IF EXISTS Plan_Vaccine;
DROP TABLE IF EXISTS Vaccine;
DROP TABLE IF EXISTS Vaccination_Plan;
DROP TABLE IF EXISTS Bill;
DROP TABLE IF EXISTS Diagnosis;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Pet;
DROP TABLE IF EXISTS Pet_Owner;
DROP TABLE IF EXISTS Health_Plan;
DROP TABLE IF EXISTS Branch;
DROP TABLE IF EXISTS Clinic;
DROP TABLE IF EXISTS Clinic_Manager;
DROP TABLE IF EXISTS Veterinarian;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS Person;

-- 1. Person & Staff Hierarchy
CREATE TABLE Person (
    person_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50),
    surname VARCHAR(50) NOT NULL,
    city VARCHAR(50),
    province VARCHAR(50),
    street VARCHAR(100),
    apt_no VARCHAR(20),
    phone_no VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255)
);

CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    salary DECIMAL(10, 2),
    FOREIGN KEY (staff_id) REFERENCES Person(person_id) ON DELETE CASCADE
);

CREATE TABLE Veterinarian (
    vet_id INT PRIMARY KEY,
    specialty VARCHAR(100),
    species_expertise VARCHAR(100),
    FOREIGN KEY (vet_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
);

CREATE TABLE Clinic_Manager (
    manager_id INT PRIMARY KEY,
    FOREIGN KEY (manager_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
);

-- 2. Clinic & Branch
CREATE TABLE Clinic (
    clinic_id INT AUTO_INCREMENT PRIMARY KEY,
    specialty VARCHAR(100)
);

CREATE TABLE Branch (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(100),
    address TEXT,
    clinic_id INT,
    manager_id INT,
    FOREIGN KEY (clinic_id) REFERENCES Clinic(clinic_id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES Clinic_Manager(manager_id) ON DELETE SET NULL
);

-- 3. Health Plans & Pet Owners
CREATE TABLE Health_Plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_fee DECIMAL(10, 2) NOT NULL,
    discount_rate DECIMAL(5, 2) NOT NULL,
    plan_type VARCHAR(50)
);

CREATE TABLE Pet_Owner (
    owner_id INT PRIMARY KEY,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    plan_id INT,
    FOREIGN KEY (owner_id) REFERENCES Person(person_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES Health_Plan(plan_id) ON DELETE SET NULL
);

-- 4. Pets
CREATE TABLE Pet (
    pet_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    species VARCHAR(50),
    breed VARCHAR(50),
    allergies TEXT,
    sex ENUM('Male', 'Female', 'Unknown'),
    age INT,
    owner_id INT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Pet_Owner(owner_id) ON DELETE CASCADE
);

-- 5. Appointments, Diagnosis, Bills
CREATE TABLE Appointment (
    appntm_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    procedure_name VARCHAR(100),
    follow_up_notes TEXT,
    pet_id INT NOT NULL,
    vet_id INT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES Veterinarian(vet_id) ON DELETE CASCADE
);

CREATE TABLE Diagnosis (
    diagn_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100),
    symptoms TEXT,
    appntm_id INT NOT NULL,
    FOREIGN KEY (appntm_id) REFERENCES Appointment(appntm_id) ON DELETE CASCADE
);

CREATE TABLE Bill (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    payment_date DATE,
    appntm_id INT NOT NULL,
    FOREIGN KEY (appntm_id) REFERENCES Appointment(appntm_id) ON DELETE CASCADE
);

-- 6. Vaccination Plans
CREATE TABLE Vaccination_Plan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    creation_date DATE NOT NULL,
    pet_id INT NOT NULL,
    vet_id INT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES Veterinarian(vet_id) ON DELETE CASCADE
);

CREATE TABLE Vaccine (
    vaccine_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    cycle_protocol VARCHAR(100)
);

CREATE TABLE Plan_Vaccine (
    plan_id INT,
    vaccine_id INT,
    planned_date DATE,
    status ENUM('Pending', 'Administered', 'Missed') DEFAULT 'Pending',
    dose_number INT,
    PRIMARY KEY (plan_id, vaccine_id, dose_number),
    FOREIGN KEY (plan_id) REFERENCES Vaccination_Plan(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES Vaccine(vaccine_id) ON DELETE CASCADE
);

-- 7. Prescriptions & Medicines (Roadmap constraint: No vet_id in Prescription)
CREATE TABLE Prescription (
    pres_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    appntm_id INT NOT NULL,
    FOREIGN KEY (appntm_id) REFERENCES Appointment(appntm_id) ON DELETE CASCADE
);

CREATE TABLE Medicine (
    med_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    expiration_date DATE
);

CREATE TABLE Prescription_Medicine (
    pres_id INT,
    med_id INT,
    quantity INT DEFAULT 1,
    PRIMARY KEY (pres_id, med_id),
    FOREIGN KEY (pres_id) REFERENCES Prescription(pres_id) ON DELETE CASCADE,
    FOREIGN KEY (med_id) REFERENCES Medicine(med_id) ON DELETE CASCADE
);

-- 8. Referrals
CREATE TABLE Referral (
    referral_id INT AUTO_INCREMENT PRIMARY KEY,
    referral_date DATE NOT NULL,
    reason TEXT,
    urgency_level ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    from_vet_id INT NOT NULL,
    to_vet_id INT NOT NULL,
    pet_id INT NOT NULL,
    FOREIGN KEY (from_vet_id) REFERENCES Veterinarian(vet_id) ON DELETE CASCADE,
    FOREIGN KEY (to_vet_id) REFERENCES Veterinarian(vet_id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE
);

-- 9. Rating (Roadmap constraint: Check 1-5)
CREATE TABLE Rating (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    owner_id INT NOT NULL,
    vet_id INT NOT NULL,
    appntm_id INT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES Pet_Owner(owner_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES Veterinarian(vet_id) ON DELETE CASCADE,
    FOREIGN KEY (appntm_id) REFERENCES Appointment(appntm_id) ON DELETE CASCADE
);

-- 10. Admin & Management Logs
CREATE TABLE Report (
    rep_id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    manager_id INT NOT NULL,
    FOREIGN KEY (manager_id) REFERENCES Clinic_Manager(manager_id) ON DELETE CASCADE
);

CREATE TABLE Notification (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    person_id INT NOT NULL,
    FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE
);

CREATE TABLE Waste (
    waste_id INT AUTO_INCREMENT PRIMARY KEY,
    med_id INT NOT NULL,
    amount INT NOT NULL,
    reason TEXT,
    date DATE NOT NULL,
    FOREIGN KEY (med_id) REFERENCES Medicine(med_id) ON DELETE CASCADE
);

CREATE TABLE Branch_Stock (
    branch_id INT,
    med_id INT,
    stock_amount INT NOT NULL DEFAULT 0,
    PRIMARY KEY (branch_id, med_id),
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (med_id) REFERENCES Medicine(med_id) ON DELETE CASCADE
);
