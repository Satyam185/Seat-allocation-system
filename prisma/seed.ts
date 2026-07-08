import { PrismaClient, SeatStatus, EmployeeStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const EMPLOYEE_COUNT = 5000;
const PROJECT_COUNT = 500;
const SEAT_COUNT = 6000;

const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Design",
  "Support",
];

const ZONES = ["A", "B", "C", "D"];

async function main() {
  faker.seed(42); // deterministic output across runs

  console.log("Clearing existing data...");
  await prisma.allocationHistory.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.project.deleteMany();

  // ---------- Projects ----------
  console.log(`Seeding ${PROJECT_COUNT} projects...`);
  const projectData = Array.from({ length: PROJECT_COUNT }).map((_, i) => ({
    name: faker.company.catchPhrase(),
    code: `PRJ-${String(i + 1).padStart(4, "0")}`,
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
      email: faker.internet
        .email({ firstName, lastName })
        .toLowerCase(),
      department: faker.helpers.arrayElement(DEPARTMENTS),
      designation: faker.person.jobTitle(),
      status: isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE,
      joinDate: faker.date.past({ years: 5 }),
      projectId: hasProject
        ? faker.helpers.arrayElement(projects).id
        : null,
    };
  });

  await prisma.employee.createMany({ data: employeeData });
  const employees = await prisma.employee.findMany({ select: { id: true } });

  // ---------- Seats ----------
  console.log(`Seeding ${SEAT_COUNT} seats...`);
  const seatedEmployeeCount = Math.min(
    Math.floor(EMPLOYEE_COUNT * 0.9),
    SEAT_COUNT
  );

  // Shuffle employees to randomize who gets a seat
  const employeesToSeat = faker.helpers
    .shuffle([...employees])
    .slice(0, seatedEmployeeCount);

  // Generate seats with pre-populated employee assignments to run in bulk
  const seatData = Array.from({ length: SEAT_COUNT }).map((_, i) => {
    const floor = faker.number.int({ min: 1, max: 10 });
    const zone = faker.helpers.arrayElement(ZONES);
    const isSeated = i < seatedEmployeeCount;
    const employeeId = isSeated ? employeesToSeat[i].id : null;
    const status = isSeated ? SeatStatus.OCCUPIED : SeatStatus.AVAILABLE;

    return {
      seatCode: `F${floor}-${zone}-${String(i + 1).padStart(4, "0")}`,
      floor,
      zone,
      status,
      employeeId,
    };
  });

  await prisma.seat.createMany({ data: seatData });

  // ---------- Allocation History ----------
  console.log("Writing allocation history...");
  const seats = await prisma.seat.findMany({
    where: { employeeId: { not: null } },
    select: { id: true, employeeId: true },
  });

  const allocationRecords = seats.map((seat) => ({
    employeeId: seat.employeeId!,
    seatId: seat.id,
    action: "ASSIGNED",
    notes: "Initial seed allocation",
  }));

  await prisma.allocationHistory.createMany({ data: allocationRecords });

  console.log("Seed complete.");
  console.log(`  Projects:  ${projects.length}`);
  console.log(`  Seats:     ${SEAT_COUNT}`);
  console.log(`  Employees: ${employees.length}`);
  console.log(`  Seated:    ${seatedEmployeeCount}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });