import prisma from "../config/prisma.js";

type TaskData = {
  title?: string;
  description?: string | null;
  dueDate?: Date | string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  completed?: boolean;
  completedAt?: Date | string | null;
  listId?: number;
};

class TaskRepository {
  // Retorna todas as Tarefas ordenadas por título.
  async findAll(userId: number, { listId, areaId }: { listId?: number; areaId?: number } = {}) {
    return prisma.task.findMany({
      where: {
        AND: [{ list: { area: { userId } } }],
        archivedAt: null,
        listId,
        list: { archivedAt: null, areaId, area: { archivedAt: null } },
      },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Tarefa pelo ID.
  async findById(userId: number, id: number) {
    return prisma.task.findFirst({
      where: { AND: [{ list: { area: { userId } } }], id, archivedAt: null, list: { archivedAt: null, area: { archivedAt: null } } },
    });
  }

  async findAnyById(userId: number, id: number) {
    return prisma.task.findUnique({
      where: { AND: [{ list: { area: { userId } } }], id },
      include: { list: { include: { area: true } } },
    });
  }

  // Cria uma nova Tarefa.
  async create(userId: number, data: TaskData & { title: string; listId: number }) {
    return prisma.task.create({
      // Aceita somente campos do recurso, sem escritas aninhadas de propriedade.
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority,
        completed: data.completed,
        completedAt: data.completedAt,
        list: { connect: { id: data.listId, AND: [{ area: { userId } }] } },
      },
    });
  }

  // Atualiza uma Tarefa existente.
  async update(userId: number, id: number, data: TaskData) {
    return prisma.task.update({
      where: { AND: [{ list: { area: { userId } } }], id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority,
        completed: data.completed,
        completedAt: data.completedAt,
        list: data.listId === undefined ? undefined : { connect: { id: data.listId, AND: [{ area: { userId } }] } },
      },
    });
  }

  // Remove uma Tarefa.
  async delete(userId: number, id: number) {
    return prisma.task.delete({
      // Revalida na escrita: uma restauração concorrente impede a exclusão.
      where: { AND: [{ list: { area: { userId } } }], id, archivedAt: { not: null } },
    });
  }

  async archive(userId: number, id: number) {
    return prisma.task.update({ where: { AND: [{ list: { area: { userId } } }], id }, data: { archivedAt: new Date() } });
  }

  async restore(userId: number, id: number) {
    return prisma.task.update({ where: { AND: [{ list: { area: { userId } } }], id }, data: { archivedAt: null } });
  }
}

export default new TaskRepository();
