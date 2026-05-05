using System.Security.Claims;
using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class HealthPlansController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public HealthPlansController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet("my")]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> GetHealthPlans()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            const string sql = @"
                SELECT 
                    hp.plan_ID AS planId,
                    hp.name AS name,
                    hp.monthly_fee AS monthlyFee,
                    hp.discount_rate AS discountRate,
                    CASE 
                        WHEN hp.plan_ID = (SELECT plan_ID FROM Pet_owner WHERE person_ID = @UserId) THEN 'Current Plan'
                        ELSE 'Available'
                    END AS subscriptionStatus
                FROM Health_plan hp
                ORDER BY hp.monthly_fee ASC";

            var plans = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(plans);
        }

        [HttpPost("subscribe/{planId}")]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> SubscribeToPlan(int planId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();
            using var transaction = await _db.BeginTransactionAsync();

            try
            {
                // Verify plan exists and get its fee
                const string getPlanSql = "SELECT monthly_fee FROM Health_plan WHERE plan_ID = @PlanId";
                var fee = await _db.QuerySingleOrDefaultAsync<decimal?>(getPlanSql, new { PlanId = planId }, transaction);

                if (fee == null)
                {
                    return NotFound("Health plan not found.");
                }

                // Check if user is already subscribed to this plan
                const string checkCurrentSql = "SELECT plan_ID FROM Pet_owner WHERE person_ID = @UserId";
                var currentPlanId = await _db.QuerySingleOrDefaultAsync<int?>(checkCurrentSql, new { UserId = userId }, transaction);

                if (currentPlanId == planId)
                {
                    return BadRequest("You are already subscribed to this plan.");
                }

                // Update Pet_owner table: set plan_ID and deduct balance
                const string updateOwnerSql = @"
                    UPDATE Pet_owner 
                    SET plan_ID = @PlanId, 
                        balance = balance - @Fee
                    WHERE person_ID = @UserId";

                await _db.ExecuteAsync(updateOwnerSql, new { PlanId = planId, Fee = fee, UserId = userId }, transaction);

                await transaction.CommitAsync();

                return Ok(new { message = "Successfully subscribed to the health plan." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while subscribing: " + ex.Message);
            }
        }
    }
}
