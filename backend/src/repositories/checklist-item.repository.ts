import prisma from "../config/prisma.js";

type ChecklistItemData = {
  title?: string;
  completed?: boolean;
  taskId?: number;
};

class ChecklistItemRepository {
  // Retorna todos os itens de checklist ordenados por título.
  async findAll(userId: number, { taskId, listId }: { taskId?: number; listId?: number } = {}) {
    return prisma.checklistItem.findMany({
      where: {
        AND: [{ task: { list: { area: { userId } } } }],
        taskId,
        task: listId === undefined ? undefined : { listId, archivedAt: null },
      },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca um item de checklist pelo ID.
  async findById(userId: number, id: number) {
    return prisma.checklistItem.findUnique({
      where: { AND: [{ task: { list: { area: { userId } } } }], id },
    });
  }

  // Cria um novo item de checklist.
  async create(userId: number, data: ChecklistItemData & { title: string; taskId: number }) {
    return prisma.checklistItem.create({
      // Aceita somente campos do recurso, sem escritas aninhadas de propriedade.
      data: {
        title: data.title,
        completed: data.completed,
        task: { connect: { id: data.taskId, AND: [{ list: { area: { userId } } }] } },
      },
    });
  }

  // Atualiza um item de checklist existente.
  async update(userId: number, id: number, data: ChecklistItemData) {
    return prisma.checklistItem.update({
      where: { AND: [{ task: { list: { area: { userId } } } }], id },
      data: {
        title: data.title,
        completed: data.completed,
        task: data.taskId === undefined ? undefined : { connect: { id: data.taskId, AND: [{ list: { area: { userId } } }] } },
      },
    });
  }

  // Remove um item de checklist.
  async delete(userId: number, id: number) {
    return prisma.checklistItem.delete({
      where: { AND: [{ task: { list: { area: { userId } } } }], id },
    });
  }
}

export default new ChecklistItemRepository();
