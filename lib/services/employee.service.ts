import { prisma } from "@/lib/db";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/lib/validations/employee.schema";
import { EmployeeStatus } from "@prisma/client";

export class EmployeeService {
  static async getEmployees(params: {
    page: number;
    limit: number;
    department?: string;
    status?: string;
    floor?: string;
    zone?: string;
    projectId?: string;
    projectCode?: string;
    unassigned?: boolean; // unseated employees
  }) {
    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    const where: any = {};

    if (params.department) {
      where.department = params.department;
    }

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.projectCode) {
      where.project = {
        code: params.projectCode,
      };
    }

    if (params.status) {
      if (params.status === "ACTIVE" || params.status === "INACTIVE") {
        where.status = params.status as EmployeeStatus;
      } else if (params.status === "AVAILABLE") {
        where.seat = null;
      } else if (params.status === "OCCUPIED" || params.status === "RESERVED") {
        where.seat = {
          status: params.status,
        };
      }
    }

    if (params.unassigned === true) {
      where.seat = null;
    }

    // Floor and Zone filters apply to the assigned seat
    if (params.floor || params.zone) {
      where.seat = {
        ...(where.seat || {}),
        ...(params.floor ? { floor: parseInt(params.floor, 10) } : {}),
        ...(params.zone ? { zone: params.zone } : {}),
      };
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        include: {
          project: true,
          seat: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      employees,
      total,
    };
  }

  static async getEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        project: true,
        seat: true,
      },
    });
  }

  static async createEmployee(data: CreateEmployeeInput) {
    return prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        name: data.name,
        email: data.email,
        department: data.department,
        role: data.role,
        projectId: data.projectId || null,
      },
      include: {
        project: true,
        seat: true,
      },
    });
  }

  static async updateEmployee(id: string, data: UpdateEmployeeInput) {
    return prisma.employee.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        project: true,
        seat: true,
      },
    });
  }

  static async deactivateEmployee(id: string) {
    return prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.INACTIVE,
      },
      include: {
        project: true,
        seat: true,
      },
    });
  }

  static async deleteEmployee(id: string) {
    // Before deleting the employee, we need to handle their seat and allocations.
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { seat: true },
    });

    if (employee?.seat) {
      await prisma.seat.update({
        where: { id: employee.seat.id },
        data: {
          employeeId: null,
          status: "AVAILABLE",
        },
      });
    }

    // Delete all seat allocations for this employee to avoid foreign key constraints
    await prisma.seatAllocation.deleteMany({
      where: { employeeId: id },
    });

    return prisma.employee.delete({
      where: { id },
    });
  }
}
