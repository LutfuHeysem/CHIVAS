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
    public class AppointmentsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public AppointmentsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAppointments()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            string sql;

            if (role == "PetOwner")
            {
                // ── RAW SQL: Get appointments for all pets owned by this user ──
                sql = @"
                    SELECT a.appntm_id  AS AppntmId,
                           a.date       AS Date,
                           a.time       AS Time,
                           a.procedure_name AS ProcedureName,
                           a.follow_up_notes AS FollowUpNotes,
                           a.status     AS Status,
                           p.name       AS PetName,
                           p.species    AS PetSpecies,
                           CONCAT(per.first_name, ' ', per.surname) AS VetName
                    FROM Appointment a
                    INNER JOIN Pet p         ON a.pet_id = p.pet_id
                    INNER JOIN Pet_Owner po  ON p.owner_id = po.owner_id
                    INNER JOIN Veterinarian v ON a.vet_id = v.vet_id
                    INNER JOIN Staff s       ON v.vet_id = s.staff_id
                    INNER JOIN Person per    ON s.staff_id = per.person_id
                    WHERE po.owner_id = @UserId
                    ORDER BY a.date DESC, a.time DESC";
            }
            else if (role == "Veterinarian")
            {
                // ── RAW SQL: Get appointments assigned to this vet ──
                sql = @"
                    SELECT a.appntm_id  AS AppntmId,
                           a.date       AS Date,
                           a.time       AS Time,
                           a.procedure_name AS ProcedureName,
                           a.follow_up_notes AS FollowUpNotes,
                           a.status     AS Status,
                           p.pet_id     AS PetId,
                           p.name       AS PetName,
                           p.species    AS PetSpecies,
                           CONCAT(oper.first_name, ' ', oper.surname) AS OwnerName
                    FROM Appointment a
                    INNER JOIN Pet p           ON a.pet_id = p.pet_id
                    INNER JOIN Pet_Owner po    ON p.owner_id = po.owner_id
                    INNER JOIN Person oper     ON po.owner_id = oper.person_id
                    WHERE a.vet_id = @UserId
                    ORDER BY a.date DESC, a.time DESC";
            }
            else
            {
                // ── RAW SQL: Managers see all appointments ──
                sql = @"
                    SELECT a.appntm_id  AS AppntmId,
                           a.date       AS Date,
                           a.time       AS Time,
                           a.procedure_name AS ProcedureName,
                           a.status     AS Status,
                           p.name       AS PetName,
                           CONCAT(vper.first_name, ' ', vper.surname) AS VetName,
                           CONCAT(oper.first_name, ' ', oper.surname) AS OwnerName
                    FROM Appointment a
                    INNER JOIN Pet p            ON a.pet_id = p.pet_id
                    INNER JOIN Veterinarian v   ON a.vet_id = v.vet_id
                    INNER JOIN Staff s          ON v.vet_id = s.staff_id
                    INNER JOIN Person vper      ON s.staff_id = vper.person_id
                    INNER JOIN Pet_Owner po     ON p.owner_id = po.owner_id
                    INNER JOIN Person oper      ON po.owner_id = oper.person_id
                    ORDER BY a.date DESC, a.time DESC
                    LIMIT 50";
            }

            var rows = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(rows);
        }

        [HttpGet("available-vets")]
        public async Task<IActionResult> GetAvailableVets()
        {
            await _db.OpenAsync();

            // ── RAW SQL: Fetch all veterinarians ──
            const string sql = @"
                SELECT v.vet_id AS vetId,
                       CONCAT(p.first_name, ' ', p.surname) AS name,
                       v.specialty AS specialty
                FROM Veterinarian v
                INNER JOIN Staff s ON v.vet_id = s.staff_id
                INNER JOIN Person p ON s.staff_id = p.person_id
                ORDER BY p.first_name";

            var vets = await _db.QueryAsync(sql);
            return Ok(vets);
        }

        [HttpPost("book")]
        [Authorize(Roles = "PetOwner,ClinicManager")]
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentRequest req)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Verify pet ownership ──
            if (role == "PetOwner")
            {
                const string ownerCheck = @"
                    SELECT COUNT(1)
                    FROM Pet
                    WHERE pet_id = @PetId AND owner_id = @OwnerId";

                var owns = await _db.ExecuteScalarAsync<int>(ownerCheck,
                    new { req.PetId, OwnerId = userId });

                if (owns == 0)
                    return BadRequest("You do not own this pet.");
            }

            // ── RAW SQL: Insert appointment (triggers will validate limits) ──
            try
            {
                const string insertSql = @"
                    INSERT INTO Appointment (date, time, procedure_name, follow_up_notes, pet_id, vet_id)
                    VALUES (@Date, @Time, @ProcedureName, @FollowUpNotes, @PetId, @VetId);
                    SELECT LAST_INSERT_ID();";

                var newId = await _db.ExecuteScalarAsync<int>(insertSql, new
                {
                    req.Date,
                    req.Time,
                    req.ProcedureName,
                    req.FollowUpNotes,
                    req.PetId,
                    req.VetId
                });

                return Ok(new { AppointmentId = newId, Message = "Appointment booked successfully." });
            }
            catch (MySqlException ex)
            {
                // Catches trigger-raised errors (daily limit, unpaid bills, etc.)
                return BadRequest(new { Error = "Booking failed", Details = ex.Message });
            }
        }
        
        [HttpPut("{id}/complete")]
        [Authorize(Roles = "Veterinarian")]
        public async Task<IActionResult> CompleteAppointment(int id)
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();
            
            // ── RAW SQL: Verify ownership and update status ──
            const string sql = "UPDATE Appointment SET status = 'Completed' WHERE appntm_id = @Id AND vet_id = @VetId";
            var affected = await _db.ExecuteAsync(sql, new { Id = id, VetId = vetId });

            if (affected == 0) return BadRequest("Could not complete appointment. Make sure you are the assigned vet.");
            
            return Ok(new { Message = "Appointment marked as completed." });
        }
    }

    public class BookAppointmentRequest
    {
        public string Date { get; set; } = null!;
        public string Time { get; set; } = null!;
        public string? ProcedureName { get; set; }
        public string? FollowUpNotes { get; set; }
        public int PetId { get; set; }
        public int VetId { get; set; }
    }
}
