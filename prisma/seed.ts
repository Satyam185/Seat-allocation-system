import { PrismaClient, SeatStatus, EmployeeStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import "dotenv/config";

const adapter = process.env.DIRECT_URL ? new PrismaPg({ connectionString: process.env.DIRECT_URL }) : null;
const prisma = adapter ? new PrismaClient({ adapter }) : new PrismaClient();

const EMPLOYEE_COUNT = 5000;

// The prompt listed 11 projects (Indigo through Mered) but explicitly asked for exactly 10.
// We'll use the first 10.
const PROJECT_NAMES = [
  "Indigo", "Indreed", "Mydreed", "Preed", "Serfy", 
  "Oreed", "bedegreed", "Opreed", "Serry", "Kaary"
];

const SEAT_COUNT = 6000;
const RESERVED_COUNT = 100;
const MAINTENANCE_COUNT = 50;

const DEPARTMENTS = [
  "Engineering", "Sales", "Marketing", "HR", 
  "Finance", "Operations", "Design", "Support",
];

const ZONES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]; // 10 zones

async function main() {
  faker.seed(42); // deterministic output across runs

  console.log("Clearing existing data...");
  await prisma.seatAllocation.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.project.deleteMany();

  // ---------- Projects ----------
  console.log(`Seeding ${PROJECT_NAMES.length} projects...`);
  const projectData = PROJECT_NAMES.map((name, i) => ({
    name,
    code: `PRJ-${String(i + 1).padStart(4, "0")}`,
    description: faker.company.catchPhrase(),
    managerName: faker.person.fullName(),
    status: "ACTIVE"
  }));

  await prisma.project.createMany({ data: projectData });
  const projects = await prisma.project.findMany({ select: { id: true } });

  // ---------- Employees ----------
  console.log(`Seeding ${EMPLOYEE_COUNT} employees...`);
  const employeeData = Array.from({ length: EMPLOYEE_COUNT }).map((_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const hasProject = faker.datatype.boolean({ probability: 0.85 });
    const isActive = faker.datatype.boolean({ probability: 0.95 });

    return {
      employeeCode: `EMP-${String(i + 1).padStart(5, "0")}`,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      department: faker.helpers.arrayElement(DEPARTMENTS),
      role: faker.person.jobTitle(), // Renamed from designation
      status: isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE,
      joinDate: faker.date.past({ years: 5 }),
      projectId: hasProject ? faker.helpers.arrayElement(projects).id : null,
    };
  });

  await prisma.employee.createMany({ data: employeeData });
  const employees = await prisma.employee.findMany({ select: { id: true, projectId: true } });

  // ---------- Seats ----------
  console.log(`Seeding ${SEAT_COUNT} seats...`);
  const unseatedCountTarget = 500; // To guarantee we satisfy > 50
  const seatedEmployeeCount = EMPLOYEE_COUNT - unseatedCountTarget;
  const availableCount = SEAT_COUNT - seatedEmployeeCount - RESERVED_COUNT - MAINTENANCE_COUNT;

  // Build the array of exact statuses to assign
  const seatStatuses: SeatStatus[] = [
    ...Array(seatedEmployeeCount).fill(SeatStatus.OCCUPIED),
    ...Array(RESERVED_COUNT).fill(SeatStatus.RESERVED),
    ...Array(MAINTENANCE_COUNT).fill(SeatStatus.MAINTENANCE),
    ...Array(availableCount).fill(SeatStatus.AVAILABLE),
  ];
  
  const shuffledStatuses = faker.helpers.shuffle(seatStatuses);
  
  // Shuffle employees to randomize who gets a seat
  const employeesToSeat = faker.helpers.shuffle([...employees]).slice(0, seatedEmployeeCount);

  const seatData: any[] = [];
  let employeeIndex = 0;
  let globalSeatIndex = 0;

  for (let floor = 1; floor <= 10; floor++) {
    for (const zone of ZONES) {
      // 6000 / 100 = 60 seats per floor/zone combo
      for (let seatNumber = 1; seatNumber <= 60; seatNumber++) {
        const status = shuffledStatuses[globalSeatIndex];
        let employeeId = null;
        
        if (status === SeatStatus.OCCUPIED) {
          employeeId = employeesToSeat[employeeIndex].id;
          employeeIndex++;
        }

        seatData.push({
          seatCode: `F${floor}-${zone}-${String(seatNumber).padStart(3, "0")}`,
          floor,
          zone,
          bay: String(faker.number.int({ min: 1, max: 20 })),
          seatNumber: String(seatNumber),
          status,
          employeeId,
        });
        
        globalSeatIndex++;
      }
    }
  }

  // Insert in chunks to avoid Prisma limits
  for (let i = 0; i < seatData.length; i += 500) {
    await prisma.seat.createMany({ data: seatData.slice(i, i + 500) });
  }

  // ---------- Allocation History ----------
  console.log("Writing seat allocations...");
  const seatedEmployeesWithSeat = await prisma.seat.findMany({
    where: { employeeId: { not: null } },
    select: { id: true, employeeId: true },
  });

  const empMap = new Map(employees.map((e) => [e.id, e.projectId]));

  const allocationRecords = seatedEmployeesWithSeat.map((seat) => ({
    employeeId: seat.employeeId!,
    seatId: seat.id,
    projectId: empMap.get(seat.employeeId!) || null,
    allocationStatus: "ACTIVE", // Renamed from action
    notes: "Initial seed allocation",
  }));

  for (let i = 0; i < allocationRecords.length; i += 500) {
    await prisma.seatAllocation.createMany({ data: allocationRecords.slice(i, i + 500) });
  }

  console.log("\n====== SEED SUMMARY ======");
  console.log(`Projects:             ${projects.length} (Target: 10)`);
  console.log(`Zones:                ${ZONES.length} (Target: 10)`);
  console.log(`Total Employees:      ${employees.length}`);
  console.log(`Unseated Employees:   ${unseatedCountTarget} (Target: > 50)`);
  console.log(`Total Seats:          ${SEAT_COUNT}`);
  console.log(`  - OCCUPIED:         ${seatedEmployeeCount}`);
  console.log(`  - AVAILABLE:        ${availableCount} (Target: >= 500)`);
  console.log(`  - RESERVED:         ${RESERVED_COUNT} (Target: >= 100)`);
  console.log(`  - MAINTENANCE:      ${MAINTENANCE_COUNT} (Target: >= 50)`);
  console.log("==========================\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });