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
    public class BillsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public BillsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet("my")]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> GetMyBills()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            const string sql = @"
                SELECT 
                    b.bill_id AS billId,
                    b.amount AS amount,
                    b.status AS status,
                    DATE_FORMAT(b.payment_date, '%Y-%m-%d') AS paymentDate,
                    a.appntm_id AS appntmId,
                    DATE_FORMAT(a.date, '%Y-%m-%d') AS appointmentDate,
                    p.name AS petName,
                    v.first_name AS vetFirstName,
                    v.surname AS vetSurname,
                    a.procedure_name AS procedureName
                FROM Bill b
                JOIN Appointment a ON b.appntm_id = a.appntm_id
                JOIN Pet p ON a.pet_ID = p.pet_ID
                JOIN Person v ON a.vet_ID = v.person_ID
                WHERE p.owner_ID = @UserId
                ORDER BY b.status DESC, a.date DESC";

            var bills = await _db.QueryAsync(sql, new { UserId = userId });
            return Ok(bills);
        }

        [HttpPost("{billId}/pay")]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> PayBill(int billId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            // First, ensure the bill belongs to the user and is unpaid
            const string checkSql = @"
                SELECT b.status
                FROM Bill b
                JOIN Appointment a ON b.appntm_id = a.appntm_id
                JOIN Pet p ON a.pet_ID = p.pet_ID
                WHERE b.bill_id = @BillId AND p.owner_ID = @UserId";

            var status = await _db.QuerySingleOrDefaultAsync<string>(checkSql, new { BillId = billId, UserId = userId });

            if (status == null)
                return NotFound("Bill not found or you don't have access.");
            
            if (status == "Paid")
                return BadRequest("Bill is already paid.");

            // Update to Paid
            const string updateSql = @"
                UPDATE Bill 
                SET status = 'Paid', payment_date = CURRENT_DATE() 
                WHERE bill_id = @BillId";

            await _db.ExecuteAsync(updateSql, new { BillId = billId });

            return Ok(new { message = "Bill paid successfully" });
        }
    }
}
