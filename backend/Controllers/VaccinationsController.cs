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
    public class VaccinationsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public VaccinationsController(MySqlConnection db)
        {
            _db = db;
        }

<<<<<<< Updated upstream
        [HttpGet("pet/{petId}")]
        public async Task<IActionResult> GetVaccinations(int petId)
        {
            await _db.OpenAsync();

            // ── RAW SQL: Fetch all planned/administered vaccines for a pet ──
            const string sql = @"
                SELECT pv.plan_id AS PlanId,
                       pv.vaccine_id AS VaccineId,
                       v.type AS VaccineType,
                       v.cycle_protocol AS CycleProtocol,
                       DATE_FORMAT(pv.planned_date, '%Y-%m-%d') AS PlannedDate,
                       pv.status AS Status,
                       pv.dose_number AS DoseNumber,
                       CONCAT(per.first_name, ' ', per.surname) AS VetName
                FROM Plan_Vaccine pv
                INNER JOIN Vaccination_Plan vp ON pv.plan_id = vp.plan_id
                INNER JOIN Vaccine v           ON pv.vaccine_id = v.vaccine_id
                INNER JOIN Veterinarian vet    ON vp.vet_id = vet.vet_id
                INNER JOIN Staff s             ON vet.vet_id = s.staff_id
                INNER JOIN Person per          ON s.staff_id = per.person_id
                WHERE vp.pet_id = @PetId
                ORDER BY pv.planned_date DESC, pv.dose_number DESC";

            var records = await _db.QueryAsync(sql, new { PetId = petId });
            return Ok(records);
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableVaccines()
        {
            await _db.OpenAsync();
            const string sql = "SELECT vaccine_id AS VaccineId, type AS Type, cycle_protocol AS CycleProtocol FROM Vaccine";
            var vaccines = await _db.QueryAsync(sql);
            return Ok(vaccines);
        }

        [HttpPost]
        [Authorize(Roles = "Veterinarian")]
        public async Task<IActionResult> ScheduleVaccine([FromBody] ScheduleVaccineRequest req)
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();
            using var transaction = await _db.BeginTransactionAsync();

            try
            {
                // ── RAW SQL: Find or create a Vaccination Plan for this pet/vet ──
                const string findPlanSql = "SELECT plan_id FROM Vaccination_Plan WHERE pet_id = @PetId AND vet_id = @VetId LIMIT 1";
                var planId = await _db.ExecuteScalarAsync<int?>(findPlanSql, new { req.PetId, VetId = vetId }, transaction);

                if (planId == null || planId == 0)
                {
                    const string createPlanSql = @"
                        INSERT INTO Vaccination_Plan (creation_date, pet_id, vet_id)
                        VALUES (CURDATE(), @PetId, @VetId);
                        SELECT LAST_INSERT_ID();";
                    planId = await _db.ExecuteScalarAsync<int>(createPlanSql, new { req.PetId, VetId = vetId }, transaction);
                }

                // ── RAW SQL: Insert dose ──
                const string insertDoseSql = @"
                    INSERT INTO Plan_Vaccine (plan_id, vaccine_id, planned_date, status, dose_number)
                    VALUES (@PlanId, @VaccineId, @PlannedDate, @Status, @DoseNumber)";

                await _db.ExecuteAsync(insertDoseSql, new
                {
                    PlanId = planId,
                    req.VaccineId,
                    req.PlannedDate,
                    req.Status,
                    req.DoseNumber
                }, transaction);

                await transaction.CommitAsync();
                return Ok(new { Message = "Vaccine scheduled successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Failed to schedule vaccine: {ex.Message}");
            }
        }
        
        [HttpPut("status")]
        [Authorize(Roles = "Veterinarian")]
        public async Task<IActionResult> UpdateVaccineStatus([FromBody] UpdateVaccineStatusRequest req)
        {
             await _db.OpenAsync();
             
             // ── RAW SQL: Update status of a specific dose ──
             const string updateSql = @"
                UPDATE Plan_Vaccine 
                SET status = @Status 
                WHERE plan_id = @PlanId AND vaccine_id = @VaccineId AND dose_number = @DoseNumber";
                
             await _db.ExecuteAsync(updateSql, new { req.Status, req.PlanId, req.VaccineId, req.DoseNumber });
             
             return Ok(new { Message = "Status updated." });
        }
    }

    public class ScheduleVaccineRequest
    {
        public int PetId { get; set; }
        public int VaccineId { get; set; }
        public string PlannedDate { get; set; } = null!;
        public string Status { get; set; } = "Pending";
        public int DoseNumber { get; set; } = 1;
    }
    
    public class UpdateVaccineStatusRequest
    {
        public int PlanId { get; set; }
        public int VaccineId { get; set; }
        public int DoseNumber { get; set; }
        public string Status { get; set; } = null!;
=======
        [HttpGet("my")]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> GetMyVaccinations()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            const string sql = @"
                SELECT 
                    vp.pet_id AS petId,
                    v.type AS vaccineName,
                    DATE_FORMAT(pv.planned_date, '%Y-%m-%d') AS plannedDate,
                    pv.status AS status,
                    pv.dose_number AS doseNumber
                FROM Plan_Vaccine pv
                INNER JOIN Vaccine v ON pv.vaccine_id = v.vaccine_id
                INNER JOIN Vaccination_Plan vp ON pv.plan_id = vp.plan_id
                INNER JOIN Pet p ON vp.pet_id = p.pet_id
                WHERE p.owner_id = @UserId
                ORDER BY pv.planned_date ASC";

            var vaccines = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(vaccines);
        }
>>>>>>> Stashed changes
    }
}
