const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const totalEmployees = await prisma.employee.count();
    const projects = await prisma.project.findMany({ select: { name: true } });
    const totalSeats = await prisma.seat.count();
    const zones = await prisma.seat.groupBy({ by: ['zone'] });
    const seatStatus = await prisma.seat.groupBy({ by: ['status'], _count: true });
    const unseated = await prisma.employee.count({ where: { seat: null } });
    
    console.log(JSON.stringify({
      totalEmployees,
      projects: projects.map(p => p.name),
      totalSeats,
      totalZones: zones.length,
      seatStatus: seatStatus.reduce((acc, curr) => ({...acc, [curr.status]: curr._count}), {}),
      unseated
    }, null, 2));
  } catch(e) { console.error(e) }
  finally { await prisma.$disconnect(); }
}
run();
