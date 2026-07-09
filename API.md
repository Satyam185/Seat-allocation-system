# API Documentation

Base URL: https://seat-allocation-system-seven.vercel.app/api

## Employees

### POST /employees
Create a new employee.

**Request Body**
```json
{
  "employeeCode": "EMP-100",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "department": "Engineering",
  "role": "Developer",
  "projectId": "cm5o59uij000c2830f3w0f90s"
}
```

**Response — 201 Created**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "employeeCode": "EMP-100",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "department": "Engineering",
    "role": "Developer",
    "status": "ACTIVE",
    "joinDate": "2026-07-09T10:00:00.000Z",
    "projectId": null,
    "createdAt": "2026-07-09T10:00:00.000Z",
    "updatedAt": "2026-07-09T10:00:00.000Z"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email"]
    },
    "formErrors": []
  }
}
```
- `409` — Employee code or email already exists
```json
{
  "error": "Employee code or email already exists"
}
```
- `500` — Server error
```json
{
  "error": "Failed to create employee"
}
```

---

### GET /employees
Fetch a paginated list of employees, optionally filtered.

**Query Parameters**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max 100)
- `department` (string, optional): Filter by department
- `status` (string, optional): Filter by status ("ACTIVE", "INACTIVE", "AVAILABLE", "OCCUPIED", "RESERVED")
- `floor` (number, optional): Filter by assigned seat floor
- `zone` (string, optional): Filter by assigned seat zone
- `projectId` (string, optional): Filter by project ID
- `projectCode` (string, optional): Filter by project code
- `unassigned` (boolean, optional): If "true", filters employees with no assigned seat

**Response — 200 OK**
```json
{
  "data": [
    {
      "id": "cm5o59uij000c2830f3w0f90s",
      "employeeCode": "EMP-100",
      "name": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch employees"
}
```

---

### GET /employees/[id]
Fetch a single employee by ID.

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "employeeCode": "EMP-100",
    "name": "John Doe"
  }
}
```

**Errors**
- `404` — Employee not found
```json
{
  "error": "Employee not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to fetch employee"
}
```

---

### PUT /employees/[id]
Update an existing employee.

**Request Body**
```json
{
  "name": "John Doe",
  "department": "Engineering"
}
```

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "name": "John Doe"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `404` — Employee not found
```json
{
  "error": "Employee not found"
}
```
- `409` — Employee code or email already exists
```json
{
  "error": "Employee code or email already exists"
}
```
- `500` — Server error
```json
{
  "error": "Failed to update employee"
}
```

---

### DELETE /employees/[id]
Delete an employee (hard delete, cleaning up seat allocations).

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s"
  }
}
```

**Errors**
- `404` — Employee not found
```json
{
  "error": "Employee not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to delete employee"
}
```

---

## Projects

### POST /projects
Create a new project.

**Request Body**
```json
{
  "name": "Project Apollo",
  "code": "APOLLO",
  "description": "Space mission",
  "managerName": "Jane Doe",
  "status": "ACTIVE"
}
```

**Response — 201 Created**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "name": "Project Apollo",
    "code": "APOLLO"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `409` — Project code already exists
```json
{
  "error": "Project code already exists"
}
```
- `500` — Server error
```json
{
  "error": "Failed to create project"
}
```

---

### GET /projects
Fetch a paginated list of projects.

**Query Parameters**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max 100)
- `name` (string, optional): Filter by project name
- `code` (string, optional): Filter by project code

**Response — 200 OK**
```json
{
  "data": [
    {
      "id": "cm5o59uij000c2830f3w0f90s",
      "name": "Project Apollo",
      "code": "APOLLO"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch projects"
}
```

---

### GET /projects/[id]
Fetch a single project by ID.

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "name": "Project Apollo"
  }
}
```

**Errors**
- `404` — Project not found
```json
{
  "error": "Project not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to fetch project"
}
```

---

### PATCH /projects/[id]
Update an existing project.

**Request Body**
```json
{
  "status": "INACTIVE"
}
```

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "status": "INACTIVE"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `404` — Project not found
```json
{
  "error": "Project not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to update project"
}
```

---

### DELETE /projects/[id]
Delete a project.

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s"
  }
}
```

**Errors**
- `404` — Project not found
```json
{
  "error": "Project not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to delete project"
}
```

---

### GET /projects/[id]/employees
Fetch all employees assigned to a specific project.

**Response — 200 OK**
```json
{
  "data": [
    {
      "id": "cm5o59uij000c2830f3w0f90s",
      "name": "John Doe",
      "projectId": "project123"
    }
  ]
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch project employees"
}
```

---

## Seats

### POST /seats
Create a new seat.

**Request Body**
```json
{
  "seatCode": "F1-A-101",
  "floor": 1,
  "zone": "A",
  "bay": "1",
  "seatNumber": "101",
  "status": "AVAILABLE"
}
```

**Response — 201 Created**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "seatCode": "F1-A-101",
    "status": "AVAILABLE"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `409` — Seat code or composite key already exists
```json
{
  "error": "Seat code or composite key already exists"
}
```
- `500` — Server error
```json
{
  "error": "Failed to create seat"
}
```

---

### GET /seats
Fetch a paginated list of seats.

**Query Parameters**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max 100)
- `status` (string, optional): Filter by seat status
- `floor` (number, optional): Filter by floor
- `zone` (string, optional): Filter by zone

**Response — 200 OK**
```json
{
  "data": [
    {
      "id": "cm5o59uij000c2830f3w0f90s",
      "seatCode": "F1-A-101",
      "status": "AVAILABLE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch seats"
}
```

---

### GET /seats/available
Fetch a paginated list of available seats.

**Query Parameters**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max 100)

**Response — 200 OK**
```json
{
  "data": [
    {
      "id": "cm5o59uij000c2830f3w0f90s",
      "seatCode": "F1-A-101",
      "status": "AVAILABLE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch available seats"
}
```

---

### POST /seats/allocate
Allocate a seat to an employee.

**Request Body**
```json
{
  "seatId": "cm5o59uij000c2830f3w0f90s",
  "employeeId": "cm5o59uij000c2830f3w0f90s"
}
```

**Response — 201 Created**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "seatCode": "F1-A-101",
    "status": "OCCUPIED",
    "employeeId": "cm5o59uij000c2830f3w0f90s"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `404` — Employee or seat not found
```json
{
  "error": "Employee not found"
}
```
- `409` — Seat already occupied or Employee already has a seat
```json
{
  "error": "Seat is not available"
}
```
- `500` — Server error
```json
{
  "error": "Failed to allocate seat"
}
```

---

### POST /seats/release
Release an allocated seat.

**Request Body**
```json
{
  "seatId": "cm5o59uij000c2830f3w0f90s"
}
```

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "seatCode": "F1-A-101",
    "status": "AVAILABLE",
    "employeeId": null
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `404` — Seat not found
```json
{
  "error": "Seat not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to release seat"
}
```

---

### POST /seats/suggest
Automatically suggest and allocate a seat for an employee.

**Request Body**
```json
{
  "employeeId": "cm5o59uij000c2830f3w0f90s"
}
```

**Response — 201 Created**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "seatCode": "F3-B-015",
    "status": "OCCUPIED",
    "employeeId": "cm5o59uij000c2830f3w0f90s"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `404` / `409` — Not found / Conflict propagated from Service
```json
{
  "error": "Employee not found" 
}
```
- `500` — Server error
```json
{
  "error": "Failed to suggest and allocate seat"
}
```

---

### PATCH /seats/[id]/status
Manually override the status of a seat (e.g., MAINTENANCE).

**Request Body**
```json
{
  "status": "MAINTENANCE"
}
```

**Response — 200 OK**
```json
{
  "data": {
    "id": "cm5o59uij000c2830f3w0f90s",
    "status": "MAINTENANCE"
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `404` — Seat not found
```json
{
  "error": "Seat not found"
}
```
- `500` — Server error
```json
{
  "error": "Failed to change seat status"
}
```

---

## Dashboard

### GET /dashboard/summary
Fetch overall dashboard statistics.

**Response — 200 OK**
```json
{
  "data": {
    "totalEmployees": 150,
    "totalSeats": 200,
    "occupiedSeats": 140,
    "reservedSeats": 10,
    "maintenanceSeats": 2,
    "availableSeats": 48,
    "unassignedCount": 10,
    "totalProjects": 5
  }
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch dashboard summary"
}
```

---

### GET /dashboard/project-utilization
Fetch seat utilization broken down by project.

**Response — 200 OK**
```json
{
  "data": [
    {
      "id": "cm5o59uij000c2830f3w0f90s",
      "name": "Project Apollo",
      "code": "APOLLO",
      "seatCount": 25
    }
  ]
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch project utilization"
}
```

---

### GET /dashboard/floor-utilization
Fetch seat utilization broken down by floor.

**Response — 200 OK**
```json
{
  "data": [
    {
      "floor": 1,
      "capacity": 50,
      "occupied": 40,
      "available": 10,
      "utilization": 80
    }
  ]
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to fetch floor utilization"
}
```

---

## AI

### POST /ai/query
Submit a natural language query for processing.

**Request Body**
```json
{
  "query": "Where is my seat? I am johndoe@example.com"
}
```

**Response — 200 OK**
```json
{
  "answer": "You are assigned to Project Apollo and are located at Floor 1, Zone A, Seat F1-A-101.",
  "data": [ ],
  "filter": {
    "entity": "seat",
    "filters": {
      "floor": 1
    }
  }
}
```

**Errors**
- `400` — Validation failed
```json
{
  "error": "Validation failed",
  "details": { }
}
```
- `500` — Server error
```json
{
  "error": "Failed to process AI query"
}
```

---

## Seed Check

### GET /seed-check
Verifies if the database has been seeded.

**Response — 200 OK**
```json
{
  "isSeeded": true
}
```

**Errors**
- `500` — Server error
```json
{
  "error": "Failed to check database status"
}
```

---

## Testing These Endpoints

You can instantly verify the API is live by hitting any GET endpoint without needing complex payloads. Here is a working `curl` example targeting the production Dashboard Summary endpoint:

```bash
curl -s -X GET "https://seat-allocation-system-seven.vercel.app/api/dashboard/summary" -H "Accept: application/json"
```
