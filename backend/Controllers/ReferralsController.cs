using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Veterinarian")]
    public class ReferralsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public ReferralsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetReferrals()
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Get referrals sent BY or TO this vet ──
            const string sql = @"
                SELECT r.referral_id   AS ReferralId,
                       DATE_FORMAT(r.referral_date, '%Y-%m-%d') AS ReferralDate,
                       r.reason        AS Reason,
                       r.urgency_level AS UrgencyLevel,
                       r.status        AS Status,
                       r.notes         AS Notes,
                       p.name          AS PetName,
                       p.species       AS PetSpecies,
                       CONCAT(fper.first_name, ' ', fper.surname) AS FromVetName,
                       CONCAT(tper.first_name, ' ', tper.surname) AS ToVetName,
                       CASE WHEN r.from_vet_id = @VetId THEN 'Outgoing' ELSE 'Incoming' END AS Direction
                FROM Referral r
                INNER JOIN Pet p           ON r.pet_id = p.pet_id
                INNER JOIN Veterinarian fv ON r.from_vet_id = fv.vet_id
                INNER JOIN Staff fs        ON fv.vet_id = fs.staff_id
                INNER JOIN Person fper     ON fs.staff_id = fper.person_id
                INNER JOIN Veterinarian tv ON r.to_vet_id = tv.vet_id
                INNER JOIN Staff ts        ON tv.vet_id = ts.staff_id
                INNER JOIN Person tper     ON ts.staff_id = tper.person_id
                WHERE r.from_vet_id = @VetId OR r.to_vet_id = @VetId
                ORDER BY r.referral_date DESC";

            var referrals = await _db.QueryAsync(sql, new { VetId = vetId });
            return Ok(referrals);
        }

        [HttpGet("vets")]
        public async Task<IActionResult> GetOtherVets()
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: List all other vets for the referral dropdown ──
            const string sql = @"
                SELECT v.vet_id AS VetId,
                       CONCAT(per.first_name, ' ', per.surname) AS Name,
                       v.specialty AS Specialty
                FROM Veterinarian v
                INNER JOIN Staff s    ON v.vet_id = s.staff_id
                INNER JOIN Person per ON s.staff_id = per.person_id
                WHERE v.vet_id != @VetId";

            var vets = await _db.QueryAsync(sql, new { VetId = vetId });
            return Ok(vets);
        }

        [HttpGet("pets")]
        public async Task<IActionResult> GetMyPets()
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Distinct pets this vet has seen ──
            const string sql = @"
                SELECT DISTINCT p.pet_id AS PetId, p.name AS Name, p.species AS Species
                FROM Appointment a
                INNER JOIN Pet p ON a.pet_id = p.pet_id
                WHERE a.vet_id = @VetId
                ORDER BY p.name";

            var pets = await _db.QueryAsync(sql, new { VetId = vetId });
            return Ok(pets);
        }

        [HttpPost]
        public async Task<IActionResult> CreateReferral([FromBody] CreateReferralRequest req)
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Insert referral ──
            const string sql = @"
                INSERT INTO Referral (referral_date, reason, urgency_level, status, notes, from_vet_id, to_vet_id, pet_id)
                VALUES (CURDATE(), @Reason, @UrgencyLevel, 'Pending', @Notes, @FromVetId, @ToVetId, @PetId);
                SELECT LAST_INSERT_ID();";

            var newId = await _db.ExecuteScalarAsync<int>(sql, new
            {
                req.Reason,
                req.UrgencyLevel,
                req.Notes,
                FromVetId = vetId,
                req.ToVetId,
                req.PetId
            });

            return Ok(new { ReferralId = newId, Message = "Referral created." });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateReferralStatusRequest req)
        {
            await _db.OpenAsync();

            // ── RAW SQL: Update referral status ──
            const string sql = "UPDATE Referral SET status = @Status, notes = @Notes WHERE referral_id = @Id";
            await _db.ExecuteAsync(sql, new { req.Status, req.Notes, Id = id });

            return Ok(new { Message = "Referral updated." });
        }
    }

    public class CreateReferralRequest
    {
        public string Reason { get; set; } = null!;
        public string UrgencyLevel { get; set; } = "Medium";
        public string? Notes { get; set; }
        public int ToVetId { get; set; }
        public int PetId { get; set; }
    }

    public class UpdateReferralStatusRequest
    {
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
    }
}
