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
    public class RatingsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public RatingsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> AddRating([FromBody] AddRatingRequest req)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            // RAW SQL: Verify appointment belongs to user and get vet_id
            const string verifySql = @"
                SELECT a.vet_id 
                FROM Appointment a
                INNER JOIN Pet p ON a.pet_id = p.pet_id
                WHERE a.appntm_id = @AppntmId AND p.owner_id = @OwnerId";
                
            var vetId = await _db.ExecuteScalarAsync<int?>(verifySql, new { req.AppntmId, OwnerId = userId });
            
            if (vetId == null)
                return Forbid("Appointment not found or you don't have permission.");

            // RAW SQL: Insert Rating
            const string insertSql = @"
                INSERT INTO Rating (score, comment, owner_id, vet_id, appntm_id)
                VALUES (@Score, @Comment, @OwnerId, @VetId, @AppntmId);";

            try
            {
                await _db.ExecuteAsync(insertSql, new
                {
                    req.Score,
                    req.Comment,
                    OwnerId = userId,
                    VetId = vetId.Value,
                    req.AppntmId
                });
                return Ok(new { Message = "Rating submitted successfully." });
            }
            catch (MySqlException ex)
            {
                return BadRequest(new { Error = "Rating failed", Details = ex.Message });
            }
        }
    }

    public class AddRatingRequest
    {
        public int AppntmId { get; set; }
        public int Score { get; set; }
        public string? Comment { get; set; }
    }
}
