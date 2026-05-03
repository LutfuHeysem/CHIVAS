using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;

namespace ChivasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MySqlConnection _db;
        private readonly IConfiguration _config;

        public AuthController(MySqlConnection db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            await _db.OpenAsync();

            // ── RAW SQL: Fetch user by email ──
            const string sql = @"
                SELECT person_id AS PersonId,
                       first_name AS FirstName,
                       surname    AS Surname,
                       email      AS Email,
                       password   AS Password,
                       password_hash AS PasswordHash
                FROM Person
                WHERE email = @Email
                LIMIT 1";

            var person = await _db.QueryFirstOrDefaultAsync<PersonRow>(sql, new { req.Email });

            if (person == null)
                return Unauthorized("Invalid email or password.");

            // Verify password — check hash first, fall back to plaintext for seeded data
            bool valid = !string.IsNullOrEmpty(person.PasswordHash)
                ? BCrypt.Net.BCrypt.Verify(req.Password, person.PasswordHash)
                : person.Password == req.Password;

            if (!valid)
                return Unauthorized("Invalid email or password.");

            // ── RAW SQL: Determine role ──
            const string roleSql = @"
                SELECT
                    CASE
                        WHEN EXISTS (SELECT 1 FROM Pet_Owner     WHERE owner_id   = @Id) THEN 'PetOwner'
                        WHEN EXISTS (SELECT 1 FROM Veterinarian  WHERE vet_id     = @Id) THEN 'Veterinarian'
                        WHEN EXISTS (SELECT 1 FROM Clinic_Manager WHERE manager_id = @Id) THEN 'ClinicManager'
                        ELSE 'Unknown'
                    END AS Role";

            var role = await _db.QueryFirstAsync<string>(roleSql, new { Id = person.PersonId });

            return Ok(GenerateToken(person.PersonId, person.Email, person.FirstName, role));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            await _db.OpenAsync();

            // ── RAW SQL: Check if email exists ──
            const string checkSql = "SELECT COUNT(1) FROM Person WHERE email = @Email";
            var exists = await _db.ExecuteScalarAsync<int>(checkSql, new { req.Email });
            if (exists > 0)
                return BadRequest("Email is already in use.");

            var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);

            // ── RAW SQL: Insert new Person ──
            const string insertPersonSql = @"
                INSERT INTO Person (first_name, surname, email, password, password_hash)
                VALUES (@FirstName, @Surname, @Email, @Password, @Hash);
                SELECT LAST_INSERT_ID();";

            var personId = await _db.ExecuteScalarAsync<int>(insertPersonSql, new
            {
                req.FirstName,
                req.Surname,
                req.Email,
                req.Password,
                Hash = hash
            });

            // ── RAW SQL: Insert into role-specific table ──
            if (req.Role == "PetOwner")
            {
                await _db.ExecuteAsync(
                    "INSERT INTO Pet_Owner (owner_id, balance) VALUES (@Id, 0.00)",
                    new { Id = personId });
            }
            else if (req.Role == "Veterinarian")
            {
                await _db.ExecuteAsync(
                    "INSERT INTO Staff (staff_id, salary) VALUES (@Id, 50000.00)",
                    new { Id = personId });
                await _db.ExecuteAsync(
                    "INSERT INTO Veterinarian (vet_id, specialty, species_expertise) VALUES (@Id, 'General', 'All')",
                    new { Id = personId });
            }
            else if (req.Role == "ClinicManager")
            {
                await _db.ExecuteAsync(
                    "INSERT INTO Staff (staff_id, salary) VALUES (@Id, 70000.00)",
                    new { Id = personId });
                await _db.ExecuteAsync(
                    "INSERT INTO Clinic_Manager (manager_id) VALUES (@Id)",
                    new { Id = personId });
            }
            else
            {
                return BadRequest("Invalid role.");
            }

            return Ok(GenerateToken(personId, req.Email, req.FirstName, req.Role));
        }

        // ── JWT Token Generator ──
        private object GenerateToken(int personId, string email, string firstName, string role)
        {
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, personId.ToString()),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("FirstName", firstName)
                }),
                Expires = DateTime.UtcNow.AddHours(2),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateToken(descriptor);

            return new
            {
                Token = handler.WriteToken(token),
                Role = role,
                PersonId = personId,
                FirstName = firstName
            };
        }
    }

    // ── DTOs ──
    public class LoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class RegisterRequest
    {
        public string FirstName { get; set; } = null!;
        public string Surname { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Role { get; set; } = "PetOwner";
    }

    internal class PersonRow
    {
        public int PersonId { get; set; }
        public string FirstName { get; set; } = null!;
        public string Surname { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? PasswordHash { get; set; }
    }
}
