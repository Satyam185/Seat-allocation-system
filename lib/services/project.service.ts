import { prisma } from "@/lib/db";
import { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project.schema";

export class ProjectService {
  static async getProjects(params: {
    page: number;
    limit: number;
    name?: string;
    code?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    const where: any = {};
    if (params.name) {
      where.name = {
        contains: params.name,
        mode: "insensitive",
      };
    }
    if (params.code) {
      where.code = {
        contains: params.code,
        mode: "insensitive",
      };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { employees: true },
          },
        },
        orderBy: { code: "asc" },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
    };
  }

  static async getProjectById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            seat: true,
          },
        },
      },
    });
  }

  static async createProject(data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        managerName: data.managerName,
        status: data.status,
      },
    });
  }

  static async updateProject(id: string, data: UpdateProjectInput) {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  static async getProjectEmployees(projectId: string) {
    return prisma.employee.findMany({
      where: { projectId },
      include: {
        seat: true,
      },
    });
  }

  static async deleteProject(id: string) {
    // Run sequentially without $transaction to avoid PgBouncer transaction-mode timeouts
    await prisma.employee.updateMany({
      where: { projectId: id },
      data: { projectId: null },
    });

    return prisma.project.delete({
      where: { id },
    });
  }
}
