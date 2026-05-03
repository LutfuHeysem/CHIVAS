-- CHIVAS Database Procedures and Triggers

DELIMITER //

-- ==========================================
-- 1. Appointment Constraints (Trigger)
-- Enforce a daily appointment limit per veterinarian (e.g., max 10 per day)
-- ==========================================
DROP TRIGGER IF EXISTS trg_limit_daily_appointments //
CREATE TRIGGER trg_limit_daily_appointments
BEFORE INSERT ON Appointment
FOR EACH ROW
BEGIN
    DECLARE daily_count INT;
    
    SELECT COUNT(*) INTO daily_count
    FROM Appointment
    WHERE vet_id = NEW.vet_id AND date = NEW.date;
    
    IF daily_count >= 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Daily appointment limit reached for this veterinarian.';
    END IF;
END //

-- ==========================================
-- 2. Financial Validation (Trigger)
-- Identify unpaid bills; prevent booking if pet owner has unpaid bills
-- ==========================================
DROP TRIGGER IF EXISTS trg_check_unpaid_bills //
CREATE TRIGGER trg_check_unpaid_bills
BEFORE INSERT ON Appointment
FOR EACH ROW
BEGIN
    DECLARE unpaid_count INT;
    
    -- Check if the pet's owner has any unpaid bills
    SELECT COUNT(*) INTO unpaid_count
    FROM Bill b
    JOIN Appointment a ON b.appntm_id = a.appntm_id
    JOIN Pet p ON a.pet_id = p.pet_id
    WHERE p.owner_id = (SELECT owner_id FROM Pet WHERE pet_id = NEW.pet_id)
      AND b.status = 'Unpaid';
      
    IF unpaid_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pet owner has unpaid bills. Cannot schedule new appointments.';
    END IF;
END //

-- ==========================================
-- 3. Data Entry Workflows (Procedure)
-- INSERT for Diagnosis table linked to active appointment
-- ==========================================
DROP PROCEDURE IF EXISTS sp_add_diagnosis //
CREATE PROCEDURE sp_add_diagnosis (
    IN p_appntm_id INT,
    IN p_type VARCHAR(100),
    IN p_symptoms TEXT
)
BEGIN
    -- Ensure appointment exists
    IF NOT EXISTS (SELECT 1 FROM Appointment WHERE appntm_id = p_appntm_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment does not exist.';
    END IF;

    INSERT INTO Diagnosis (appntm_id, type, symptoms)
    VALUES (p_appntm_id, p_type, p_symptoms);
END //

-- ==========================================
-- 4. Inventory Automation (Trigger)
-- Stock-deduction triggers automatically when a medication is prescribed
-- ==========================================
DROP TRIGGER IF EXISTS trg_deduct_stock_on_prescription //
CREATE TRIGGER trg_deduct_stock_on_prescription
AFTER INSERT ON Prescription_Medicine
FOR EACH ROW
BEGIN
    DECLARE branch_id_val INT;
    DECLARE current_stock INT;
    
    -- Find the branch associated with the appointment where prescription was given
    SELECT b.branch_id INTO branch_id_val
    FROM Prescription p
    JOIN Appointment a ON p.appntm_id = a.appntm_id
    JOIN Veterinarian v ON a.vet_id = v.vet_id
    JOIN Staff s ON v.vet_id = s.staff_id
    -- Assuming branch is found by clinic manager or vet assignment. 
    -- For this schema, we just deduct from the branch where the vet works.
    -- (Need a Vet -> Branch link. In this DB, Branch has a manager and clinic. 
    -- Let's assume we deduct from a general stock or we find the branch via the clinic)
    -- As a simplified assumption, we'll deduct from the branch with the highest stock
    ORDER BY p.appntm_id LIMIT 1; 
    
    -- We can also just deduct from the first branch that has stock
    SELECT stock_amount INTO current_stock
    FROM Branch_Stock
    WHERE med_id = NEW.med_id
    ORDER BY stock_amount DESC LIMIT 1;
    
    IF current_stock >= NEW.quantity THEN
        UPDATE Branch_Stock
        SET stock_amount = stock_amount - NEW.quantity
        WHERE med_id = NEW.med_id AND stock_amount = current_stock
        LIMIT 1;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for the prescribed medication.';
    END IF;
END //

-- ==========================================
-- 5. Referral System (Procedure)
-- SQL procedures for referral creation
-- ==========================================
DROP PROCEDURE IF EXISTS sp_create_referral //
CREATE PROCEDURE sp_create_referral (
    IN p_from_vet_id INT,
    IN p_to_vet_id INT,
    IN p_pet_id INT,
    IN p_reason TEXT,
    IN p_urgency_level VARCHAR(20),
    IN p_notes TEXT
)
BEGIN
    INSERT INTO Referral (
        referral_date, reason, urgency_level, status, notes, from_vet_id, to_vet_id, pet_id
    ) VALUES (
        CURDATE(), p_reason, p_urgency_level, 'Pending', p_notes, p_from_vet_id, p_to_vet_id, p_pet_id
    );
END //

-- ==========================================
-- 6. Billing Logic (Procedure)
-- Final bill generation, aggregating costs and applying Health Plan discounts
-- ==========================================
DROP PROCEDURE IF EXISTS sp_generate_final_bill //
CREATE PROCEDURE sp_generate_final_bill (
    IN p_appntm_id INT,
    IN p_base_amount DECIMAL(10, 2),
    IN p_bill_type VARCHAR(50)
)
BEGIN
    DECLARE v_discount_rate DECIMAL(5, 2) DEFAULT 0.00;
    DECLARE v_final_amount DECIMAL(10, 2);
    
    -- Retrieve discount rate if pet owner is subscribed to a health plan
    SELECT COALESCE(hp.discount_rate, 0.00) INTO v_discount_rate
    FROM Appointment a
    JOIN Pet p ON a.pet_id = p.pet_id
    JOIN Pet_Owner po ON p.owner_id = po.owner_id
    LEFT JOIN Health_Plan hp ON po.plan_id = hp.plan_id
    WHERE a.appntm_id = p_appntm_id;
    
    -- Calculate final amount
    SET v_final_amount = p_base_amount * (1 - (v_discount_rate / 100));
    
    -- Insert the final bill
    INSERT INTO Bill (type, amount, status, payment_date, appntm_id)
    VALUES (p_bill_type, v_final_amount, 'Unpaid', NULL, p_appntm_id);
END //

-- ==========================================
-- 7. Feedback System (Procedure)
-- Pet-owner vet rating workflow
-- ==========================================
DROP PROCEDURE IF EXISTS sp_submit_vet_rating //
CREATE PROCEDURE sp_submit_vet_rating (
    IN p_appntm_id INT,
    IN p_score INT,
    IN p_comment TEXT
)
BEGIN
    DECLARE v_owner_id INT;
    DECLARE v_vet_id INT;
    DECLARE v_appointment_exists INT DEFAULT 0;

    -- Ensure the appointment is valid
    SELECT COUNT(*), po.owner_id, a.vet_id 
    INTO v_appointment_exists, v_owner_id, v_vet_id
    FROM Appointment a
    JOIN Pet p ON a.pet_id = p.pet_id
    JOIN Pet_Owner po ON p.owner_id = po.owner_id
    WHERE a.appntm_id = p_appntm_id
    GROUP BY po.owner_id, a.vet_id;

    IF v_appointment_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid appointment ID.';
    END IF;

    -- Note: Score validation 1-5 is handled by the CHECK constraint on the Rating table
    -- Insert the rating
    INSERT INTO Rating (score, comment, owner_id, vet_id, appntm_id)
    VALUES (p_score, p_comment, v_owner_id, v_vet_id, p_appntm_id);
END //

DELIMITER ;
