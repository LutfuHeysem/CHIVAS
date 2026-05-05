using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "PetOwner")]
    public class HistoryController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public HistoryController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetMedicalHistory()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Comprehensive Medical History Query ──
            const string sql = @"
                SELECT 
                    a.appntm_id AS appntmId,
                    DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
                    TIME_FORMAT(a.time, '%H:%i') AS time,
                    a.procedure_name AS procedureName,
                    a.follow_up_notes AS followUpNotes,
                    p.name AS petName,
                    p.species AS species,
                    CONCAT(vper.first_name, ' ', vper.surname) AS vetName,
                    d.type AS diagnosisType,
                    d.symptoms AS diagnosisSymptoms,
                    b.amount AS billAmount,
                    b.status AS billStatus,
                    DATE_FORMAT(b.payment_date, '%Y-%m-%d') AS paymentDate,
                    r.score AS ratingScore,
                    r.comment AS ratingComment,
                    GROUP_CONCAT(CONCAT(m.name, ' (x', pm.quantity, ')') SEPARATOR ', ') AS medicines
                FROM Appointment a
                INNER JOIN Pet p ON a.pet_id = p.pet_id
                INNER JOIN Veterinarian v ON a.vet_id = v.vet_id
                INNER JOIN Staff s ON v.vet_id = s.staff_id
                INNER JOIN Person vper ON s.staff_id = vper.person_id
                LEFT JOIN Diagnosis d ON a.appntm_id = d.appntm_id
                LEFT JOIN Bill b ON a.appntm_id = b.appntm_id
                LEFT JOIN Prescription pr ON a.appntm_id = pr.appntm_id
                LEFT JOIN Prescription_Medicine pm ON pr.pres_id = pm.pres_id
                LEFT JOIN Medicine m ON pm.med_id = m.med_id
                LEFT JOIN Rating r ON a.appntm_id = r.appntm_id
                WHERE p.owner_id = @UserId AND a.date <= CURDATE()
                GROUP BY 
                    a.appntm_id, a.date, a.time, a.procedure_name, a.follow_up_notes, 
                    p.name, p.species, vper.first_name, vper.surname, 
                    d.type, d.symptoms, b.amount, b.status, b.payment_date, r.score, r.comment
                ORDER BY a.date DESC, a.time DESC;";

            var history = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(history);
        }
    }
}
