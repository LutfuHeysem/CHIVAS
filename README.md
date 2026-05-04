# VetCare — Veterinary Clinic Management System

> CS353 Database Systems — Group Project

---

## Overview

VetCare is a multi-branch veterinary clinic management system designed to streamline the operations of veterinary practices. It supports pet owner registration, appointment scheduling, vaccination tracking, prescriptions, billing, staff management, and health plan subscriptions across multiple clinic branches.

---

## Features

- **Pet & Owner Management** — Register pet owners and their pets with full medical profiles (species, breed, allergies, sex, age)
- **Appointments** — Book, track, and follow up on appointments with procedure notes
- **Vaccination Plans** — Administer and track vaccination schedules with dose tracking
- **Prescriptions** — Veterinarians issue prescriptions linked to medicines and appointments
- **Billing** — Generate and track bills and payment status per appointment
- **Referrals** — Manage inter-clinic referrals with urgency levels and status tracking
- **Health Plans** — Pet owners subscribe to health plans with monthly fees and discount rates
- **Staff & Clinic Management** — Manage veterinarians, clinic managers, branches, and clinics
- **Reports & Waste Logs** — Clinic managers create reports and log medicine waste
- **Notifications & Ratings** — Send notifications to persons; owners rate veterinarians

---

## Entity Overview

| Entity | Key Attributes |
|---|---|
| Pet | pet-ID, name, species, breed, allergies, sex, age |
| Pet Owner | balance, subscribed health plan |
| Person | person-ID, name, address, phone, email |
| Appointment | appntm-id, date, time, procedure-name, follow-up-notes |
| Vaccination Plan | plan-id, creation-date |
| Vaccine | type, cycle-protocol |
| Prescription | pres-id, date |
| Medicine | med-id, name, category, expiration-date |
| Bill | bill-id, amount, status, payment-date |
| Diagnosis | diagn-id, symptoms |
| Veterinarian | specialty, species-expertise |
| Clinic Manager | (extends Staff, Person) |
| Staff | salary |
| Branch | branch-id, location, address |
| Clinic | clinic-id, specialty |
| Health Plan | plan-ID, name, monthly-fee, discount-rate, plan-type |
| Referral | referral-id, date, reason, urgency-level, status, notes |
| Rating | rating-ID, score, comment |
| Report | rep-ID, content, date, time |
| Waste | waste-id, amount, reason, date |
| Notification | notif-id, content |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL |
| Backend | .NET |
| Frontend | React |
| ORM / Query | EF Core, RAW SQL |

---

## Setup

1. Clone the repository
2. Create the database and run `db/schema.sql`
3. Seed with `db/seed.sql` (optional)
4. Configure your backend connection string
5. Run the application

---

## Team

Hasan Tufan - 22203594
Lütfü Heysem Kızıloğlu - 22301926
Nijat Mukhtarov - 22301195
Eser Tekin Tekeli - 22301742
Emir Said Bakan - 22302852

---

## Course Info

- **Course:** CS353 — Database Systems
- **Semester:** Spring 2026
