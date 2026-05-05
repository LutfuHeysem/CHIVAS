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
    public class MedicalRecordsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public MedicalRecordsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet("pet/{petId}")]
        public async Task<IActionResult> GetMedicalHistory(int petId)
        {
            await _db.OpenAsync();

            // ── RAW SQL: Get past appointments with diagnoses and prescriptions ──
            const string sql = @"
                SELECT a.appntm_id AS AppntmId,
                       DATE_FORMAT(a.date, '%Y-%m-%d') AS Date,
                       TIME_FORMAT(a.time, '%H:%i') AS Time,
                       a.procedure_name AS ProcedureName,
                       a.follow_up_notes AS FollowUpNotes,
                       CONCAT(per.first_name, ' ', per.surname) AS VetName,
                       d.type AS DiagnosisType,
                       d.symptoms AS Symptoms,
                       pr.pres_id AS PrescriptionId
                FROM Appointment a
                INNER JOIN Veterinarian v ON a.vet_id = v.vet_id
                INNER JOIN Staff s        ON v.vet_id = s.staff_id
                INNER JOIN Person per     ON s.staff_id = per.person_id
                LEFT JOIN Diagnosis d     ON a.appntm_id = d.appntm_id
                LEFT JOIN Prescription pr ON a.appntm_id = pr.appntm_id
                WHERE a.pet_id = @PetId
                ORDER BY a.date DESC, a.time DESC";

            var records = (await _db.QueryAsync(sql, new { PetId = petId })).ToList();

            return Ok(records);
        }

        [HttpPost("diagnosis")]
        [Authorize(Roles = "Veterinarian")]
        public async Task<IActionResult> AddDiagnosis([FromBody] AddDiagnosisRequest req)
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Ensure the vet is assigned to this appointment ──
            var checkSql = "SELECT COUNT(1) FROM Appointment WHERE appntm_id = @AppntmId AND vet_id = @VetId";
            var owns = await _db.ExecuteScalarAsync<int>(checkSql, new { req.AppntmId, VetId = vetId });
            
            if (owns == 0) return BadRequest("You can only diagnose your own appointments.");

            // ── RAW SQL: Insert diagnosis ──
            const string insertSql = @"
                INSERT INTO Diagnosis (type, symptoms, appntm_id)
                VALUES (@Type, @Symptoms, @AppntmId);
                SELECT LAST_INSERT_ID();";

            var newId = await _db.ExecuteScalarAsync<int>(insertSql, new
            {
                req.Type,
                req.Symptoms,
                req.AppntmId
            });

            return Ok(new { DiagnosisId = newId, Message = "Diagnosis added." });
        }

        [HttpPost("prescription")]
        [Authorize(Roles = "Veterinarian")]
        public async Task<IActionResult> AddPrescription([FromBody] AddPrescriptionRequest req)
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();
            using var transaction = await _db.BeginTransactionAsync();

            try
            {
                // ── RAW SQL: Ensure vet is assigned to this appointment ──
                var checkSql = "SELECT COUNT(1) FROM Appointment WHERE appntm_id = @AppntmId AND vet_id = @VetId";
                var owns = await _db.ExecuteScalarAsync<int>(checkSql, new { req.AppntmId, VetId = vetId }, transaction);
                
                if (owns == 0) return BadRequest("You can only prescribe for your own appointments.");

                // ── RAW SQL: Create prescription ──
                const string insertPresSql = @"
                    INSERT INTO Prescription (date, appntm_id)
                    VALUES (CURDATE(), @AppntmId);
                    SELECT LAST_INSERT_ID();";

                var presId = await _db.ExecuteScalarAsync<int>(insertPresSql, new { req.AppntmId }, transaction);

                // ── RAW SQL: Add medicines to prescription ──
                const string insertMedSql = @"
                    INSERT INTO Prescription_Medicine (pres_id, med_id, quantity)
                    VALUES (@PresId, @MedId, @Quantity)";

                foreach (var med in req.Medicines)
                {
                    await _db.ExecuteAsync(insertMedSql, new
                    {
                        PresId = presId,
                        MedId = med.MedId,
                        Quantity = med.Quantity
                    }, transaction);
                }

                await transaction.CommitAsync();
                return Ok(new { PrescriptionId = presId, Message = "Prescription created." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Failed to create prescription: {ex.Message}");
            }
        }
        
        [HttpGet("medicines")]
        [Authorize(Roles = "Veterinarian")]
        public async Task<IActionResult> GetMedicines()
        {
             await _db.OpenAsync();
             const string sql = "SELECT med_id AS MedId, name AS Name, category AS Category FROM Medicine";
             var meds = await _db.QueryAsync(sql);
             return Ok(meds);
        }
    }

    public class AddDiagnosisRequest
    {
        public string Type { get; set; } = null!;
        public string Symptoms { get; set; } = null!;
        public int AppntmId { get; set; }
    }

    public class AddPrescriptionRequest
    {
        public int AppntmId { get; set; }
        public List<PrescribedMedicine> Medicines { get; set; } = new();
    }

    public class PrescribedMedicine
    {
        public int MedId { get; set; }
        public int Quantity { get; set; }
    }
}
