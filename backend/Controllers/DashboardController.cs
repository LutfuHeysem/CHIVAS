using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public DashboardController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            if (role == "PetOwner")
                return Ok(await OwnerSummary(userId));
            else if (role == "Veterinarian")
                return Ok(await VetSummary(userId));
            else if (role == "ClinicManager")
                return Ok(await ManagerSummary(userId));

            return Ok(new { Message = "Unknown role" });
        }

        /* ════════════════════════════════════════════
           PET OWNER SUMMARY — All Raw SQL
           ════════════════════════════════════════════ */
        private async Task<object> OwnerSummary(int ownerId)
        {
            // ── RAW SQL: Fetch all pets for this owner ──
            const string petsSql = @"
                SELECT pet_id   AS PetId,
                       name     AS Name,
                       species  AS Species,
                       breed    AS Breed,
                       age      AS Age,
                       sex      AS Sex
                FROM Pet
                WHERE owner_id = @OwnerId";

            var pets = (await _db.QueryAsync(petsSql, new { OwnerId = ownerId })).ToList();

            // ── RAW SQL: Count upcoming appointments using subquery ──
            const string upcomingSql = @"
                SELECT COUNT(*)
                FROM Appointment a
                INNER JOIN Pet p ON a.pet_id = p.pet_id
                WHERE p.owner_id = @OwnerId
                  AND a.date >= CURDATE()";

            var upcomingCount = await _db.ExecuteScalarAsync<int>(upcomingSql, new { OwnerId = ownerId });

            // ── RAW SQL: Count total appointments ──
            const string totalSql = @"
                SELECT COUNT(*)
                FROM Appointment a
                INNER JOIN Pet p ON a.pet_id = p.pet_id
                WHERE p.owner_id = @OwnerId";

            var totalAppointments = await _db.ExecuteScalarAsync<int>(totalSql, new { OwnerId = ownerId });

            // ── RAW SQL: Get health plan name via LEFT JOIN ──
            const string planSql = @"
                SELECT COALESCE(hp.name, 'No Plan') AS PlanName,
                       po.balance AS Balance
                FROM Pet_Owner po
                LEFT JOIN Health_Plan hp ON po.plan_id = hp.plan_id
                WHERE po.owner_id = @OwnerId";

            var planRow = await _db.QueryFirstOrDefaultAsync(planSql, new { OwnerId = ownerId });

            // ── RAW SQL: Fetch next 5 upcoming appointments with JOINs ──
            const string appointmentsSql = @"
                SELECT a.appntm_id AS AppntmId,
                       DATE_FORMAT(a.date, '%Y-%m-%d') AS Date,
                       TIME_FORMAT(a.time, '%H:%i') AS Time,
                       p.name AS PetName,
                       CONCAT(per.first_name, ' ', per.surname) AS VetName,
                       a.procedure_name AS ProcedureName
                FROM Appointment a
                INNER JOIN Pet p          ON a.pet_id = p.pet_id
                INNER JOIN Veterinarian v ON a.vet_id = v.vet_id
                INNER JOIN Staff s        ON v.vet_id = s.staff_id
                INNER JOIN Person per     ON s.staff_id = per.person_id
                WHERE p.owner_id = @OwnerId
                  AND a.date >= CURDATE()
                ORDER BY a.date ASC, a.time ASC
                LIMIT 5";

            var appointments = await _db.QueryAsync(appointmentsSql, new { OwnerId = ownerId });

            return new
            {
                Role = "PetOwner",
                Stats = new
                {
                    TotalPets = pets.Count,
                    UpcomingAppointmentCount = upcomingCount,
                    TotalAppointments = totalAppointments,
                    Balance = (decimal)(planRow?.Balance ?? 0m),
                    HealthPlan = (string)(planRow?.PlanName ?? "No Plan")
                },
                Pets = pets,
                UpcomingAppointments = appointments
            };
        }

        /* ════════════════════════════════════════════
           VETERINARIAN SUMMARY — All Raw SQL
           ════════════════════════════════════════════ */
        private async Task<object> VetSummary(int vetId)
        {
            // ── RAW SQL: Today's schedule with multiple JOINs ──
            const string scheduleSql = @"
                SELECT a.appntm_id AS AppntmId,
                       TIME_FORMAT(a.time, '%H:%i') AS Time,
                       p.name      AS PetName,
                       COALESCE(p.species, 'Unknown') AS Species,
                       CONCAT(oper.first_name, ' ', oper.surname) AS OwnerName,
                       a.procedure_name AS ProcedureName
                FROM Appointment a
                INNER JOIN Pet p           ON a.pet_id = p.pet_id
                INNER JOIN Pet_Owner po    ON p.owner_id = po.owner_id
                INNER JOIN Person oper     ON po.owner_id = oper.person_id
                WHERE a.vet_id = @VetId
                  AND a.date = CURDATE()
                ORDER BY a.time ASC";

            var schedule = (await _db.QueryAsync(scheduleSql, new { VetId = vetId })).ToList();

            // ── RAW SQL: Count upcoming appointments ──
            const string upcomingSql = @"
                SELECT COUNT(*)
                FROM Appointment
                WHERE vet_id = @VetId AND date > CURDATE()";

            var upcoming = await _db.ExecuteScalarAsync<int>(upcomingSql, new { VetId = vetId });

            // ── RAW SQL: Count distinct patients using DISTINCT ──
            const string patientsSql = @"
                SELECT COUNT(DISTINCT pet_id)
                FROM Appointment
                WHERE vet_id = @VetId";

            var patients = await _db.ExecuteScalarAsync<int>(patientsSql, new { VetId = vetId });

            return new
            {
                Role = "Veterinarian",
                Stats = new
                {
                    TodaysAppointments = schedule.Count,
                    UpcomingAppointments = upcoming,
                    TotalUniquePatients = patients
                },
                TodaysSchedule = schedule
            };
        }

        /* ════════════════════════════════════════════
           CLINIC MANAGER SUMMARY — All Raw SQL
           ════════════════════════════════════════════ */
        private async Task<object> ManagerSummary(int managerId)
        {
            // ── RAW SQL: Aggregate clinic stats in one query ──
            const string statsSql = @"
                SELECT
                    (SELECT COUNT(*) FROM Veterinarian)  AS TotalVeterinarians,
                    (SELECT COUNT(*) FROM Pet_Owner)     AS TotalPetOwners,
                    (SELECT COUNT(*) FROM Pet)           AS TotalPets,
                    (SELECT COUNT(*) FROM Appointment)   AS TotalAppointments,
                    (SELECT COUNT(*) FROM Appointment WHERE date = CURDATE()) AS TodaysAppointments";

            var stats = await _db.QueryFirstAsync(statsSql);

            // ── RAW SQL: Recent 5 appointments with full JOIN chain ──
            const string recentSql = @"
                SELECT a.appntm_id AS AppntmId,
                       DATE_FORMAT(a.date, '%Y-%m-%d') AS Date,
                       TIME_FORMAT(a.time, '%H:%i') AS Time,
                       p.name AS PetName,
                       CONCAT(vper.first_name, ' ', vper.surname) AS VetName,
                       a.procedure_name AS ProcedureName
                FROM Appointment a
                INNER JOIN Pet p            ON a.pet_id = p.pet_id
                INNER JOIN Veterinarian v   ON a.vet_id = v.vet_id
                INNER JOIN Staff s          ON v.vet_id = s.staff_id
                INNER JOIN Person vper      ON s.staff_id = vper.person_id
                ORDER BY a.date DESC, a.time DESC
                LIMIT 5";

            var recent = await _db.QueryAsync(recentSql);

            return new
            {
                Role = "ClinicManager",
                Stats = new
                {
                    TotalVeterinarians = (int)(stats.TotalVeterinarians),
                    TotalPetOwners = (int)(stats.TotalPetOwners),
                    TotalPets = (int)(stats.TotalPets),
                    TotalAppointments = (int)(stats.TotalAppointments),
                    TodaysAppointments = (int)(stats.TodaysAppointments)
                },
                RecentAppointments = recent
            };
        }
    }
}
