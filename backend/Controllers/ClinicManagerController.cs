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

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            await _db.OpenAsync();

            const string planSql = @"
                SELECT hp.name AS PlanName, COUNT(po.owner_id) AS Subscribers
                FROM Health_Plan hp
                LEFT JOIN Pet_Owner po ON hp.plan_id = po.plan_id
                GROUP BY hp.plan_id, hp.name";

            const string revenueSql = "SELECT COALESCE(SUM(amount), 0) FROM Bill WHERE status = 'Paid'";

            var planDistribution = await _db.QueryAsync(planSql);
            var totalRevenue = await _db.ExecuteScalarAsync<decimal>(revenueSql);

            return Ok(new
            {
                TotalRevenue = totalRevenue,
                PlanDistribution = planDistribution
            });
        }

        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory()
        {
            await _db.OpenAsync();
            const string sql = @"
                SELECT m.med_id AS id,
                       m.name AS name,
                       m.category AS category,
                       DATE_FORMAT(m.expiration_date, '%Y-%m-%d') AS expirationDate,
                       bs.stock_amount AS stockAmount
                FROM Medicine m
                INNER JOIN Branch_Stock bs ON m.med_id = bs.med_id
                ORDER BY bs.stock_amount ASC";
            
            var inventory = await _db.QueryAsync(sql);
            return Ok(inventory);
        }

        [HttpGet("staff")]
        public async Task<IActionResult> GetStaff()
        {
            await _db.OpenAsync();
            const string sql = @"
                SELECT p.person_id AS id,
                       p.first_name AS firstName,
                       p.surname AS surname,
                       p.email AS email,
                       v.specialty AS specialty,
                       v.species_expertise AS speciesExpertise,
                       COALESCE((SELECT AVG(score) FROM Rating r WHERE r.vet_id = v.vet_id), 0) AS averageRating
                FROM Veterinarian v
                INNER JOIN Staff s ON v.vet_id = s.staff_id
                INNER JOIN Person p ON s.staff_id = p.person_id";

            var staff = await _db.QueryAsync(sql);
            return Ok(staff);
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            await _db.OpenAsync();

            const string billStatsSql = @"
                SELECT type AS Type, SUM(amount) AS TotalRevenue, COUNT(*) AS Count 
                FROM Bill 
                WHERE status = 'Paid' 
                GROUP BY type";
            
            const string appointmentStatsSql = @"
                SELECT status AS Status, COUNT(*) AS Count 
                FROM Appointment 
                GROUP BY status";

            var billStats = await _db.QueryAsync(billStatsSql);
            var appntStats = await _db.QueryAsync(appointmentStatsSql);

            return Ok(new
            {
                RevenueByType = billStats,
                AppointmentsByStatus = appntStats
            });
        }
    }
}
