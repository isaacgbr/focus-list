import prisma from "../config/prisma.js";

class ArchiveRepository {
  async findAll() {
    const [areas, lists, tasks] = await Promise.all([
      prisma.area.findMany({
        where: { archivedAt: { not: null } },
        include: {
          lists: { select: { _count: { select: { tasks: true } } } },
        },
      }),
      prisma.list.findMany({
        where: {
          archivedAt: { not: null },
          area: { archivedAt: null },
        },
        include: {
          area: { select: { title: true } },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          archivedAt: { not: null },
          list: { archivedAt: null, area: { archivedAt: null } },
        },
        include: {
          list: {
            select: {
              title: true,
              area: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    return [
      ...areas.map(({ lists: areaLists, ...area }) => ({
        ...area,
        type: "area" as const,
        context: null,
        canRestore: true,
        listCount: areaLists.length,
        taskCount: areaLists.reduce((total, list) => total + list._count.tasks, 0),
      })),
      ...lists.map(({ area, _count, ...list }) => ({
        ...list,
        type: "list" as const,
        context: area.title,
        canRestore: true,
        areaTitle: area.title,
        taskCount: _count.tasks,
      })),
      ...tasks.map(({ list, ...task }) => ({
        ...task,
        type: "task" as const,
        context: `${list.area.title} / ${list.title}`,
        canRestore: true,
        areaTitle: list.area.title,
        listTitle: list.title,
      })),
    ].sort((first, second) =>
      (second.archivedAt?.getTime() ?? 0) - (first.archivedAt?.getTime() ?? 0),
    );
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
      where: {
        id,
        OR: [
          { archivedAt: { not: null } },
          { area: { archivedAt: { not: null } } },
        ],
      },
      include: {
        area: { select: { id: true, title: true, archivedAt: true } },
        tasks: { orderBy: { title: "asc" } },
      },
    });
  }

  async findTaskById(id: number) {
    return prisma.task.findFirst({
      where: {
        id,
        OR: [
          { archivedAt: { not: null } },
          { list: { archivedAt: { not: null } } },
          { list: { area: { archivedAt: { not: null } } } },
        ],
      },
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
