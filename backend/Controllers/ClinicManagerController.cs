using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "ClinicManager")]
    public class ClinicManagerController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public ClinicManagerController(MySqlConnection db)
        {
            _db = db;
        }

        // ════════════════════════════════════════════
        // INVENTORY MANAGEMENT
        // ════════════════════════════════════════════

        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory()
        {
            await _db.OpenAsync();

            const string sql = @"
                SELECT m.med_id AS medId,
                       m.name AS name,
                       m.category AS category,
                       DATE_FORMAT(m.expiration_date, '%Y-%m-%d') AS expirationDate,
                       COALESCE(bs.stock_amount, 0) AS stockAmount
                FROM Medicine m
                LEFT JOIN Branch_Stock bs ON m.med_id = bs.med_id
                ORDER BY m.name ASC";

            var inventory = await _db.QueryAsync(sql);
            return Ok(inventory);
        }

        [HttpPost("inventory/stock")]
        public async Task<IActionResult> UpdateStock([FromBody] UpdateStockRequest req)
        {
            await _db.OpenAsync();

            // Default branch_id = 1 for global access as requested
            const int defaultBranchId = 1;

            const string sql = @"
                INSERT INTO Branch_Stock (branch_id, med_id, stock_amount)
                VALUES (@BranchId, @MedId, @Amount)
                ON DUPLICATE KEY UPDATE stock_amount = stock_amount + @Amount";

            await _db.ExecuteAsync(sql, new { BranchId = defaultBranchId, MedId = req.MedId, Amount = req.Amount });

            return Ok(new { Message = "Stock updated successfully." });
        }

        [HttpPost("inventory/waste")]
        public async Task<IActionResult> RecordWaste([FromBody] RecordWasteRequest req)
        {
            await _db.OpenAsync();

            using var transaction = await _db.BeginTransactionAsync();
            try
            {
                // Default branch_id = 1
                const int defaultBranchId = 1;

                // Check current stock
                const string checkStockSql = "SELECT stock_amount FROM Branch_Stock WHERE branch_id = @BranchId AND med_id = @MedId";
                var currentStock = await _db.QueryFirstOrDefaultAsync<int?>(checkStockSql, new { BranchId = defaultBranchId, MedId = req.MedId }, transaction);

                if (currentStock == null || currentStock < req.Amount)
                {
                    return BadRequest("Insufficient stock to record waste.");
                }

                // Deduct stock
                const string deductStockSql = "UPDATE Branch_Stock SET stock_amount = stock_amount - @Amount WHERE branch_id = @BranchId AND med_id = @MedId";
                await _db.ExecuteAsync(deductStockSql, new { BranchId = defaultBranchId, MedId = req.MedId, Amount = req.Amount }, transaction);

                // Insert into Waste table
                const string insertWasteSql = @"
                    INSERT INTO Waste (med_id, amount, reason, date)
                    VALUES (@MedId, @Amount, @Reason, CURDATE())";
                await _db.ExecuteAsync(insertWasteSql, new { MedId = req.MedId, Amount = req.Amount, Reason = req.Reason }, transaction);

                await transaction.CommitAsync();
                return Ok(new { Message = "Waste recorded and stock updated." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        // ════════════════════════════════════════════
        // REPORTS MANAGEMENT
        // ════════════════════════════════════════════

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            await _db.OpenAsync();

            const string sql = @"
                SELECT r.rep_id AS reportId,
                       r.content AS content,
                       DATE_FORMAT(r.date, '%Y-%m-%d') AS date,
                       TIME_FORMAT(r.time, '%H:%i') AS time,
                       r.manager_id AS managerId,
                       CONCAT(p.first_name, ' ', p.surname) AS managerName
                FROM Report r
                INNER JOIN Clinic_Manager cm ON r.manager_id = cm.manager_id
                INNER JOIN Staff s ON cm.manager_id = s.staff_id
                INNER JOIN Person p ON s.staff_id = p.person_id
                ORDER BY r.date DESC, r.time DESC";

            var reports = await _db.QueryAsync(sql);
            return Ok(reports);
        }

        [HttpPost("reports")]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest req)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int managerId))
                return Unauthorized();

            await _db.OpenAsync();

            const string sql = @"
                INSERT INTO Report (content, date, time, manager_id)
                VALUES (@Content, CURDATE(), CURTIME(), @ManagerId)";

            await _db.ExecuteAsync(sql, new { Content = req.Content, ManagerId = managerId });

            return Ok(new { Message = "Report created successfully." });
        }

        // ════════════════════════════════════════════
        // HEALTH PLAN ANALYTICS (ranked with window fn)
        // ════════════════════════════════════════════

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            await _db.OpenAsync();

            // Uses RANK() window function and LEFT JOIN to compute popularity rank
            const string sql = @"
                SELECT hp.plan_id AS planId,
                       hp.name AS planName,
                       hp.monthly_fee AS monthlyFee,
                       hp.discount_rate AS discountRate,
                       hp.plan_type AS planType,
                       COUNT(po.owner_id) AS subscriberCount,
                       COALESCE(SUM(hp.monthly_fee), 0) AS monthlyRevenue,
                       RANK() OVER (ORDER BY COUNT(po.owner_id) DESC) AS popularityRank
                FROM Health_Plan hp
                LEFT JOIN Pet_Owner po ON hp.plan_id = po.plan_id
                GROUP BY hp.plan_id, hp.name, hp.monthly_fee, hp.discount_rate, hp.plan_type
                ORDER BY popularityRank ASC";

            var analytics = await _db.QueryAsync(sql);
            return Ok(analytics);
        }

        // ════════════════════════════════════════════
        // HEALTH PLAN MANAGEMENT (CRUD)
        // ════════════════════════════════════════════

        [HttpPost("healthplans")]
        public async Task<IActionResult> CreateHealthPlan([FromBody] HealthPlanRequest req)
        {
            await _db.OpenAsync();

            const string sql = @"
                INSERT INTO Health_Plan (name, monthly_fee, discount_rate, plan_type)
                VALUES (@Name, @MonthlyFee, @DiscountRate, @PlanType)";

            await _db.ExecuteAsync(sql, new
            {
                Name = req.Name,
                MonthlyFee = req.MonthlyFee,
                DiscountRate = req.DiscountRate,
                PlanType = req.PlanType
            });

            return Ok(new { Message = "Health plan created successfully." });
        }

        [HttpPut("healthplans/{id}")]
        public async Task<IActionResult> UpdateHealthPlan(int id, [FromBody] HealthPlanRequest req)
        {
            await _db.OpenAsync();

            const string sql = @"
                UPDATE Health_Plan
                SET name = @Name,
                    monthly_fee = @MonthlyFee,
                    discount_rate = @DiscountRate,
                    plan_type = @PlanType
                WHERE plan_id = @PlanId";

            var rows = await _db.ExecuteAsync(sql, new
            {
                Name = req.Name,
                MonthlyFee = req.MonthlyFee,
                DiscountRate = req.DiscountRate,
                PlanType = req.PlanType,
                PlanId = id
            });

            if (rows == 0) return NotFound(new { Message = "Health plan not found." });
            return Ok(new { Message = "Health plan updated successfully." });
        }

        // ════════════════════════════════════════════
        // MARKETING TARGETS — unsubscribed high spenders
        // ════════════════════════════════════════════

        [HttpGet("marketing-targets")]
        public async Task<IActionResult> GetMarketingTargets()
        {
            await _db.OpenAsync();

            // Finds pet owners with no plan who have paid > $1500 total in bills
            // Uses multiple JOINs + HAVING to identify high-value unsubscribed customers
            const string sql = @"
                SELECT p.person_id AS personId,
                       p.first_name AS firstName,
                       p.surname AS surname,
                       p.email AS email,
                       SUM(b.amount) AS totalSpent
                FROM Person p
                JOIN Pet_Owner po ON p.person_id = po.owner_id
                JOIN Pet pt ON po.owner_id = pt.owner_id
                JOIN Appointment a ON pt.pet_id = a.pet_id
                JOIN Bill b ON a.appntm_id = b.appntm_id
                WHERE po.plan_id IS NULL
                  AND b.status = 'Paid'
                GROUP BY p.person_id, p.first_name, p.surname, p.email
                HAVING SUM(b.amount) > 1500.00
                ORDER BY totalSpent DESC";

            var targets = await _db.QueryAsync(sql);
            return Ok(targets);
        }

        [HttpGet("staff")]
        public async Task<IActionResult> GetStaff()
        {
            await _db.OpenAsync();

            const string sql = @"
                SELECT v.vet_id AS vetId,
                       CONCAT(p.first_name, ' ', p.surname) AS name,
                       p.email AS email,
                       v.specialty AS specialty,
                       v.species_expertise AS speciesExpertise,
                       (SELECT COALESCE(AVG(score), 0) FROM Rating WHERE vet_id = v.vet_id) AS averageRating,
                       (SELECT COUNT(*) FROM Rating WHERE vet_id = v.vet_id) AS ratingCount
                FROM Veterinarian v
                INNER JOIN Staff s ON v.vet_id = s.staff_id
                INNER JOIN Person p ON s.staff_id = p.person_id
                ORDER BY p.first_name ASC";

            var staff = await _db.QueryAsync(sql);
            return Ok(staff);
        }
    }

    public class UpdateStockRequest
    {
        public int MedId { get; set; }
        public int Amount { get; set; }
    }

    public class RecordWasteRequest
    {
        public int MedId { get; set; }
        public int Amount { get; set; }
        public string Reason { get; set; } = null!;
    }

    public class CreateReportRequest
    {
        public string Content { get; set; } = null!;
    }

    public class HealthPlanRequest
    {
        public string Name { get; set; } = null!;
        public decimal MonthlyFee { get; set; }
        public decimal DiscountRate { get; set; }
        public string PlanType { get; set; } = null!;
    }
}
