import prisma from "../config/prisma.js";

type TaskData = {
  title?: string;
  description?: string;
  dueDate?: Date | string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  completed?: boolean;
  completedAt?: Date | string;
  listId?: number;
};

class TaskRepository {
  // Retorna todas as Tarefas ordenadas por título.
  async findAll() {
    return prisma.task.findMany({
      where: { archivedAt: null, list: { archivedAt: null, area: { archivedAt: null } } },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Tarefa pelo ID.
  async findById(id: number) {
    return prisma.task.findFirst({
      where: { id, archivedAt: null, list: { archivedAt: null, area: { archivedAt: null } } },
    });
  }

  async findAnyById(id: number) {
    return prisma.task.findUnique({
      where: { id },
      include: { list: { include: { area: true } } },
    });
  }

  // Cria uma nova Tarefa.
  async create(data: TaskData & { title: string; listId: number }) {
    return prisma.task.create({
      data,
    });
  }

  // Atualiza uma Tarefa existente.
  async update(id: number, data: TaskData) {
    return prisma.task.update({
      where: { id },
      data,
    });
  }

  // Remove uma Tarefa.
  async delete(id: number) {
    return prisma.task.delete({
      where: { id },
    });
  }

  async archive(id: number) {
    return prisma.task.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async restore(id: number) {
    return prisma.task.update({ where: { id }, data: { archivedAt: null } });
  }
}

export default new TaskRepository();
