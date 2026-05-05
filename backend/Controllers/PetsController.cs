using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "PetOwner,Veterinarian,ClinicManager")]
    public class PetsController : ControllerBase
    {
        private readonly MySqlConnection _db;

        public PetsController(MySqlConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyPets()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            if (role == "PetOwner")
            {
                // RAW SQL: Fetch pets for this specific owner
                const string sql = @"
                    SELECT pet_id   AS petId,
                           name     AS name,
                           species  AS species,
                           breed    AS breed,
                           allergies AS allergies,
                           sex      AS sex,
                           age      AS age
                    FROM Pet
                    WHERE owner_id = @OwnerId
                    ORDER BY pet_id DESC";

                var pets = await _db.QueryAsync(sql, new { OwnerId = userId });
                return Ok(pets);
            }
            else
            {
                // RAW SQL: For vets and managers, fetch all pets
                const string sql = @"
                    SELECT p.pet_id   AS petId,
                           p.name     AS name,
                           p.species  AS species,
                           p.breed    AS breed,
                           p.allergies AS allergies,
                           p.sex      AS sex,
                           p.age      AS age,
                           CONCAT(per.first_name, ' ', per.surname) AS ownerName
                    FROM Pet p
                    INNER JOIN Pet_Owner po ON p.owner_id = po.owner_id
                    INNER JOIN Person per ON po.owner_id = per.person_id
                    ORDER BY p.pet_id DESC";

                var pets = await _db.QueryAsync(sql);
                return Ok(pets);
            }
        }

        [HttpPost]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> AddPet([FromBody] AddPetRequest req)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            // Validate enum
            var validSex = new[] { "Male", "Female", "Unknown" };
            if (!validSex.Contains(req.Sex))
            {
                req.Sex = "Unknown";
            }

            // RAW SQL: Insert new pet
            const string insertSql = @"
                INSERT INTO Pet (name, species, breed, allergies, sex, age, owner_id)
                VALUES (@Name, @Species, @Breed, @Allergies, @Sex, @Age, @OwnerId);
                SELECT LAST_INSERT_ID();";

            var newId = await _db.ExecuteScalarAsync<int>(insertSql, new
            {
                req.Name,
                req.Species,
                req.Breed,
                req.Allergies,
                req.Sex,
                req.Age,
                OwnerId = userId
            });

            return Ok(new { PetId = newId, Message = "Pet added successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "PetOwner")]
        public async Task<IActionResult> DeletePet(int id)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            await _db.OpenAsync();

            // RAW SQL: Delete pet and cascade will handle the rest
            const string sql = "DELETE FROM Pet WHERE pet_id = @PetId AND owner_id = @OwnerId";
            var affected = await _db.ExecuteAsync(sql, new { PetId = id, OwnerId = userId });

            if (affected == 0)
                return NotFound("Pet not found or you do not have permission to delete it.");

            return Ok(new DeletePetResponse { Message = "Pet deleted successfully." });
        }
    }

    public class AddPetRequest
    {
        public string Name { get; set; } = null!;
        public string? Species { get; set; }
        public string? Breed { get; set; }
        public string? Allergies { get; set; }
        public string? Sex { get; set; }
        public int? Age { get; set; }
    }

    public class DeletePetResponse
    {
        public string Message { get; set; } = null!;
    }
}
