$ErrorActionPreference = "Continue"

# Create a brand new employee for testing
$newEmployeeBody = @{
    employeeCode = "TEST-" + (Get-Random -Minimum 1000 -Maximum 9999)
    name = "Test User"
    email = "test.user" + (Get-Random -Minimum 100 -Maximum 999) + "@example.com"
    department = "Engineering"
    role = "Developer"
} | ConvertTo-Json

$newEmployeeRes = Invoke-RestMethod "http://localhost:3000/api/employees" -Method POST -Body $newEmployeeBody -ContentType "application/json"
$employeeId = $newEmployeeRes.data.id
Write-Output "Created New Employee: $employeeId"

# Find an available seat
$seats = Invoke-RestMethod "http://localhost:3000/api/seats/available?limit=1"
$seatId = $seats.data[0].id
Write-Output "Testing with Seat: $seatId"

Write-Output "`n--- Testing allocateSeat ---"
$allocateBody = @{
    employeeId = $employeeId
    seatId = $seatId
} | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/allocate" -Method POST -Body $allocateBody -ContentType "application/json"
    Write-Output "Allocate Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Allocate Failed: $_"
}

Write-Output "`n--- Testing allocateNewJoiner (Should Fail 409 - already allocated) ---"
$suggestBody = @{
    employeeId = $employeeId
} | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/suggest" -Method POST -Body $suggestBody -ContentType "application/json"
    Write-Output "Suggest Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Suggest Failed (Expected if already allocated): $_"
}

Write-Output "`n--- Testing releaseSeat ---"
$releaseBody = @{
    seatId = $seatId
} | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/release" -Method POST -Body $releaseBody -ContentType "application/json"
    Write-Output "Release Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Release Failed: $_"
}

Write-Output "`n--- Testing allocateNewJoiner (After Release) ---"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/suggest" -Method POST -Body $suggestBody -ContentType "application/json"
    Write-Output "Suggest Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
    $suggestedSeatId = $res.data.seat.id
} catch {
    Write-Output "Suggest Failed: $_"
}

Write-Output "`n--- Testing releaseSeat (Cleanup) ---"
$releaseBody2 = @{
    seatId = $suggestedSeatId
} | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/release" -Method POST -Body $releaseBody2 -ContentType "application/json"
    Write-Output "Release 2 Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Release 2 Failed: $_"
}

Write-Output "`n--- Testing changeSeatStatus (MAINTENANCE) ---"
$statusBody = @{
    status = "MAINTENANCE"
} | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/$seatId/status" -Method PATCH -Body $statusBody -ContentType "application/json"
    Write-Output "Status Change Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Status Change Failed: $_"
}

Write-Output "`n--- Testing allocateSeat (Should Fail on MAINTENANCE) ---"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/allocate" -Method POST -Body $allocateBody -ContentType "application/json"
    Write-Output "Allocate Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Allocate Failed (Expected 409): $_"
}

Write-Output "`n--- Testing changeSeatStatus (AVAILABLE) ---"
$statusBody = @{
    status = "AVAILABLE"
} | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/api/seats/$seatId/status" -Method PATCH -Body $statusBody -ContentType "application/json"
    Write-Output "Status Change Success: $($res | ConvertTo-Json -Depth 3 -Compress)"
} catch {
    Write-Output "Status Change Failed: $_"
}
