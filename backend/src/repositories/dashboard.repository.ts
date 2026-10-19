import prisma from "../config/prisma.js";

const activeTaskWhere = {
  archivedAt: null,
  list: { archivedAt: null, area: { archivedAt: null } },
} as const;

const dashboardTaskSelect = {
  id: true,
  title: true,
  dueDate: true,
  listId: true,
  list: {
    select: {
      areaId: true,
      title: true,
      area: { select: { color: true } },
    },
  },
  checklist: {
    where: { completed: true },
    select: { id: true },
  },
  _count: { select: { checklist: true, links: true } },
} as const;

class DashboardRepository {
  async getSummary(today: Date, tomorrow: Date, weekEndExclusive: Date) {
    const [
      areas,
      completionGroups,
      overdueCount,
      todayCount,
      weekCount,
      earliestOverdue,
      inProgress,
      upcoming,
      firstList,
    ] = await Promise.all([
      prisma.area.findMany({
        where: { archivedAt: null },
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          color: true,
          lists: {
            where: { archivedAt: null },
            select: {
              id: true,
              _count: { select: { tasks: { where: { archivedAt: null } } } },
            },
          },
        },
      }),
      prisma.task.groupBy({
        by: ["completed"],
        where: activeTaskWhere,
        _count: { _all: true },
      }),
      prisma.task.count({
        where: { ...activeTaskWhere, completed: false, dueDate: { lt: today } },
      }),
      prisma.task.count({
        where: { ...activeTaskWhere, completed: false, dueDate: { gte: today, lt: tomorrow } },
      }),
      prisma.task.count({
        where: { ...activeTaskWhere, completed: false, dueDate: { gte: tomorrow, lt: weekEndExclusive } },
      }),
      prisma.task.findFirst({
        where: { ...activeTaskWhere, completed: false, dueDate: { lt: today } },
        orderBy: { dueDate: "asc" },
        select: { dueDate: true },
      }),
      prisma.task.findMany({
        where: { ...activeTaskWhere, completed: false },
        orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
        take: 3,
        select: dashboardTaskSelect,
      }),
      prisma.task.findMany({
        where: {
          ...activeTaskWhere,
          completed: false,
          dueDate: { gte: today, lt: weekEndExclusive },
        },
        orderBy: [{ dueDate: "asc" }, { title: "asc" }],
        take: 3,
        select: dashboardTaskSelect,
      }),
      prisma.list.findFirst({
        where: { archivedAt: null, area: { archivedAt: null } },
        orderBy: { title: "asc" },
        select: { id: true, areaId: true },
      }),
    ]);

    const completed = completionGroups.find((group) => group.completed)?._count._all ?? 0;
    const pending = completionGroups.find((group) => !group.completed)?._count._all ?? 0;
    const total = completed + pending;
    const toDashboardTask = (task: (typeof inProgress)[number]) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      listId: task.listId,
      areaId: task.list.areaId,
      listTitle: task.list.title,
      listColor: task.list.area.color,
      checklistCompleted: task.checklist.length,
      checklistTotal: task._count.checklist,
      linksTotal: task._count.links,
    });
    const areaSummaries = areas.map((area) => ({
      id: area.id,
      title: area.title,
      color: area.color,
      listsTotal: area.lists.length,
      tasksTotal: area.lists.reduce((areaTotal, list) => areaTotal + list._count.tasks, 0),
    })).sort((first, second) => second.tasksTotal - first.tasksTotal || second.listsTotal - first.listsTotal);

    return {
      attention: {
        overdue: overdueCount,
        today: todayCount,
        week: weekCount,
        earliestOverdue: earliestOverdue?.dueDate ?? null,
      },
      inProgress: inProgress.map(toDashboardTask),
      upcoming: upcoming.map(toDashboardTask),
      overview: {
        total,
        pending,
        completed,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      areas: areaSummaries,
      firstAreaId: areas[0]?.id ?? null,
      firstList,
    };
  }
}

export default new DashboardRepository();
