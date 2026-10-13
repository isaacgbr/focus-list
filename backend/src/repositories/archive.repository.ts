import prisma from "../config/prisma.js";

class ArchiveRepository {
  async findAll() {
    const areas = await prisma.area.findMany({
      where: { archivedAt: { not: null } },
      include: {
        lists: { select: { _count: { select: { tasks: true } } } },
      },
      orderBy: { archivedAt: "desc" },
    });

    return areas.map(({ lists, ...area }) => ({
        ...area,
        type: "area" as const,
        context: null,
        canRestore: true,
        listCount: lists.length,
        taskCount: lists.reduce((total, list) => total + list._count.tasks, 0),
      }));
  }

  async findAreaById(id: number) {
    return prisma.area.findFirst({
      where: { id, archivedAt: { not: null } },
      include: {
        lists: {
          orderBy: { title: "asc" },
          include: { tasks: { orderBy: { title: "asc" } } },
        },
      },
    });
  }

  async findListById(id: number) {
    return prisma.list.findFirst({
      where: { id, archivedAt: { not: null } },
      include: {
        area: { select: { id: true, title: true, archivedAt: true } },
        tasks: { orderBy: { title: "asc" } },
      },
    });
  }

  async findListsByAreaId(areaId: number) {
    return prisma.list.findMany({
      where: {
        areaId,
        archivedAt: { not: null },
        area: { archivedAt: null },
      },
      include: { _count: { select: { tasks: true } } },
      orderBy: { archivedAt: "desc" },
    });
  }

  async findTasksByListId(listId: number) {
    return prisma.task.findMany({
      where: {
        listId,
        archivedAt: { not: null },
        list: { archivedAt: null, area: { archivedAt: null } },
      },
      orderBy: { archivedAt: "desc" },
    });
  }

  async findTaskById(id: number) {
    return prisma.task.findFirst({
      where: { id, archivedAt: { not: null } },
      include: {
        list: {
          select: {
            id: true,
            title: true,
            archivedAt: true,
            area: { select: { id: true, title: true, archivedAt: true } },
          },
        },
        checklist: { orderBy: { createdAt: "asc" } },
        links: { orderBy: { createdAt: "asc" } },
      },
    });
  }
}

export default new ArchiveRepository();
