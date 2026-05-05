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
    public class PatientsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public PatientsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyPatients()
        {
            var vetIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(vetIdStr, out int vetId)) return Unauthorized();

            await _db.OpenAsync();

            // ── RAW SQL: Get all unique pets this vet has treated with owner info ──
            const string sql = @"
                SELECT DISTINCT
                       p.pet_id     AS PetId,
                       p.name       AS Name,
                       p.species    AS Species,
                       p.breed      AS Breed,
                       p.allergies  AS Allergies,
                       p.sex        AS Sex,
                       p.age        AS Age,
                       CONCAT(per.first_name, ' ', per.surname) AS OwnerName,
                       per.email    AS OwnerEmail,
                       per.phone_no AS OwnerPhone,
                       (SELECT COUNT(*) FROM Appointment WHERE pet_id = p.pet_id AND vet_id = @VetId) AS VisitCount,
                       (SELECT DATE_FORMAT(MAX(date), '%Y-%m-%d') FROM Appointment WHERE pet_id = p.pet_id AND vet_id = @VetId) AS LastVisit
                FROM Appointment a
                INNER JOIN Pet p          ON a.pet_id = p.pet_id
                INNER JOIN Pet_Owner po   ON p.owner_id = po.owner_id
                INNER JOIN Person per     ON po.owner_id = per.person_id
                WHERE a.vet_id = @VetId
                ORDER BY p.name ASC";

            var patients = await _db.QueryAsync(sql, new { VetId = vetId });
            return Ok(patients);
        }

        [HttpGet("{petId}")]
        public async Task<IActionResult> GetPatientDetail(int petId)
        {
            await _db.OpenAsync();

            // ── RAW SQL: Get pet details ──
            const string petSql = @"
                SELECT p.pet_id AS PetId, p.name AS Name, p.species AS Species,
                       p.breed AS Breed, p.allergies AS Allergies, p.sex AS Sex, p.age AS Age,
                       CONCAT(per.first_name, ' ', per.surname) AS OwnerName,
                       per.email AS OwnerEmail, per.phone_no AS OwnerPhone
                FROM Pet p
                INNER JOIN Pet_Owner po ON p.owner_id = po.owner_id
                INNER JOIN Person per   ON po.owner_id = per.person_id
                WHERE p.pet_id = @PetId";

            var pet = await _db.QueryFirstOrDefaultAsync(petSql, new { PetId = petId });
            if (pet == null) return NotFound();

            // ── RAW SQL: Get all diagnoses for this pet ──
            const string diagSql = @"
                SELECT d.type AS Type, d.symptoms AS Symptoms,
                       DATE_FORMAT(a.date, '%Y-%m-%d') AS Date,
                       a.procedure_name AS ProcedureName
                FROM Diagnosis d
                INNER JOIN Appointment a ON d.appntm_id = a.appntm_id
                WHERE a.pet_id = @PetId
                ORDER BY a.date DESC";

            var diagnoses = await _db.QueryAsync(diagSql, new { PetId = petId });

            // ── RAW SQL: Get vaccination status for this pet ──
            const string vacSql = @"
                SELECT v.type AS VaccineType, pv.status AS Status,
                       DATE_FORMAT(pv.planned_date, '%Y-%m-%d') AS PlannedDate,
                       pv.dose_number AS DoseNumber
                FROM Plan_Vaccine pv
                INNER JOIN Vaccination_Plan vp ON pv.plan_id = vp.plan_id
                INNER JOIN Vaccine v           ON pv.vaccine_id = v.vaccine_id
                WHERE vp.pet_id = @PetId
                ORDER BY pv.planned_date DESC";

            var vaccinations = await _db.QueryAsync(vacSql, new { PetId = petId });

            return Ok(new { Pet = pet, Diagnoses = diagnoses, Vaccinations = vaccinations });
        }
    }
}
