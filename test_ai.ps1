$ErrorActionPreference = "Continue"

# 1. Create Project Talos
$projectRes = Invoke-RestMethod -Uri "http://localhost:3000/api/projects" -Method POST -Body (@{
    name = "Talos"
    code = "PRJ-TALOS"
    managerName = "John Doe"
    status = "ACTIVE"
    description = "Talos Project"
} | ConvertTo-Json) -ContentType "application/json"
$projectId = $projectRes.data.id
Write-Output "Created Project Talos: $projectId"

# 2. Create Employee Amit
$employeeRes = Invoke-RestMethod -Uri "http://localhost:3000/api/employees" -Method POST -Body (@{
    employeeCode = "EMP-AMIT123"
    name = "Amit"
    email = "amit@ethara.ai"
    department = "Engineering"
    role = "Developer"
    projectId = $projectId
} | ConvertTo-Json) -ContentType "application/json"
$employeeId = $employeeRes.data.id
Write-Output "Created Employee Amit: $employeeId"

# 3. Find a Seat for Amit on Floor 2, Zone B
$seatRes = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/available?limit=100"
$targetSeat = $seatRes.data | Where-Object { $_.floor -eq 2 -and $_.zone -eq "B" } | Select-Object -First 1

if ($targetSeat) {
    # Allocate seat to Amit
    Invoke-RestMethod -Uri "http://localhost:3000/api/seats/allocate" -Method POST -Body (@{
        employeeId = $employeeId
        seatId = $targetSeat.id
    } | ConvertTo-Json) -ContentType "application/json"
    Write-Output "Allocated Seat to Amit: $($targetSeat.seatCode)"
} else {
    Write-Output "Warning: No available seat found on Floor 2, Zone B."
}

# 4. Test Queries
Write-Output "`n--- Testing AI Queries ---"

$queries = @(
    "Where is my seat? My email is amit@ethara.ai",
    "Where is my seat?",
    "Which project am I assigned to? My email is amit@ethara.ai",
    "Show all available seats on Floor 3.",
    "How many seats are occupied for Project Talos?"
)

foreach ($q in $queries) {
    Write-Output "Query: $q"
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/query" -Method POST -Body (@{ query = $q } | ConvertTo-Json) -ContentType "application/json"
        Write-Output "Response: $($res.answer)`n"
    } catch {
        Write-Output "Error: $_`n"
    }
}
