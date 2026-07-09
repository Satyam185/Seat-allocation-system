import { PrismaClient, SeatStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = process.env.DIRECT_URL ? new PrismaPg({ connectionString: process.env.DIRECT_URL }) : null;
const prisma = adapter ? new PrismaClient({ adapter }) : new PrismaClient();

async function main() {
  console.log("=== Verification Script ===");

  // 1. Exactly 10 projects exist, matching the named list
  const requiredProjectNames = [
    "Indigo", "Indreed", "Mydreed", "Preed", "Serfy",
    "Oreed", "bedegreed", "Opreed", "Serry", "Kaary"
  ];
  const projects = await prisma.project.findMany();
  const projectNames = projects.map(p => p.name).sort();
  const requiredSorted = [...requiredProjectNames].sort();
  
  const matchesProjects = projectNames.length === requiredSorted.length && 
    projectNames.every((v, i) => v === requiredSorted[i]);
  console.log(`Projects Check: ${matchesProjects ? 'PASS' : 'FAIL'}`);
  console.log(`- Expected (${requiredSorted.length}): ${requiredSorted.join(', ')}`);
  console.log(`- Actual (${projectNames.length}): ${projectNames.join(', ')}`);

  // 2. Exactly 10 zones in use
  const seats = await prisma.seat.findMany({ select: { zone: true }});
  const zones = new Set(seats.map(s => s.zone));
  console.log(`Zones Check: ${zones.size === 10 ? 'PASS' : 'FAIL'}`);
  console.log(`- Actual zones (${zones.size}): ${Array.from(zones).sort().join(', ')}`);

  // 3. Seat status counts
  const availableCount = await prisma.seat.count({ where: { status: SeatStatus.AVAILABLE } });
  const reservedCount = await prisma.seat.count({ where: { status: SeatStatus.RESERVED } });
  const maintenanceCount = await prisma.seat.count({ where: { status: SeatStatus.MAINTENANCE } });
  const occupiedCount = await prisma.seat.count({ where: { status: SeatStatus.OCCUPIED } });
  const totalSeats = availableCount + reservedCount + maintenanceCount + occupiedCount;

  const seatsPass = availableCount >= 500 && reservedCount >= 100 && maintenanceCount > 0 && totalSeats === 6000;
  console.log(`Seats Check: ${seatsPass ? 'PASS' : 'FAIL'}`);
  console.log(`- AVAILABLE: ${availableCount} (>= 500)`);
  console.log(`- RESERVED: ${reservedCount} (>= 100)`);
  console.log(`- MAINTENANCE: ${maintenanceCount} (> 0)`);
  console.log(`- OCCUPIED: ${occupiedCount}`);
  console.log(`- Total: ${totalSeats}`);

  // 4. Unseated employees >= 50
  const unseatedEmployees = await prisma.employee.count({ where: { seat: null } });
  console.log(`Unseated Employees Check: ${unseatedEmployees >= 50 ? 'PASS' : 'FAIL'}`);
  console.log(`- Unseated: ${unseatedEmployees} (>= 50)`);

  // 5. Test Composite Unique Constraint
  console.log("\nTesting Composite Constraint...");
  
  const testSeat1 = {
    seatCode: "TEST-SEAT-1",
    floor: 99,
    zone: "TEST",
    bay: "1",
    seatNumber: "100"
  };

  const testSeat2 = {
    seatCode: "TEST-SEAT-2", // Different seat code to isolate the constraint test
    floor: 99,
    zone: "TEST",
    bay: "1",
    seatNumber: "100"
  };

  try {
    const res1 = await fetch("http://localhost:3000/api/seats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testSeat1)
    });
    console.log(`- Create Seat 1 (99-TEST-100): HTTP ${res1.status}`);

    const res2 = await fetch("http://localhost:3000/api/seats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testSeat2)
    });
    console.log(`- Create Seat 2 (99-TEST-100): HTTP ${res2.status} (Expected 409)`);
    console.log(`Composite Constraint Check: ${res2.status === 409 ? 'PASS' : 'FAIL'}`);
  } catch (e: any) {
    console.log(`Composite Constraint Check: FAIL (Network Error: ${e.message})`);
  }

  // Clean up test seat
  await prisma.seat.deleteMany({ where: { floor: 99 } });

  // 6. Test Allocating OCCUPIED seat
  console.log("\nTesting Allocate OCCUPIED...");
  const occupiedSeat = await prisma.seat.findFirst({ where: { status: SeatStatus.OCCUPIED } });
  const unseatedEmployee = await prisma.employee.findFirst({ where: { seat: null } });
  
  if (occupiedSeat && unseatedEmployee) {
    const allocRes = await fetch("http://localhost:3000/api/seats/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: unseatedEmployee.id,
        seatId: occupiedSeat.id
      })
    });
    console.log(`- Allocate OCCUPIED: HTTP ${allocRes.status} (Expected 409)`);
    console.log(`Allocate OCCUPIED Check: ${allocRes.status === 409 ? 'PASS' : 'FAIL'}`);
  } else {
    console.log(`Allocate OCCUPIED Check: SKIP (Missing occupied seat or unseated employee)`);
  }

  // 7. Test Allocating RESERVED seat
  console.log("\nTesting Allocate RESERVED...");
  const reservedSeat = await prisma.seat.findFirst({ where: { status: SeatStatus.RESERVED } });
  const anotherUnseated = await prisma.employee.findFirst({ 
    where: { 
      seat: null,
      id: { not: unseatedEmployee?.id }
    } 
  });

  if (reservedSeat && anotherUnseated) {
    const resAlloc = await fetch("http://localhost:3000/api/seats/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: anotherUnseated.id,
        seatId: reservedSeat.id
      })
    });
    console.log(`- Allocate RESERVED: HTTP ${resAlloc.status} (Expected 409)`);
    console.log(`Allocate RESERVED Check: ${resAlloc.status === 409 ? 'PASS' : 'FAIL'}`);
  } else {
    console.log(`Allocate RESERVED Check: SKIP (Missing reserved seat or unseated employee)`);
  }

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
