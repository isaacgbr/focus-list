import prisma from "../config/prisma.js";

type ChecklistItemData = {
  title?: string;
  completed?: boolean;
  taskId?: number;
};

class ChecklistItemRepository {
  // Retorna todos os itens de checklist ordenados por título.
  async findAll({ taskId, listId }: { taskId?: number; listId?: number } = {}) {
    return prisma.checklistItem.findMany({
      where: {
        taskId,
        task: listId === undefined ? undefined : { listId, archivedAt: null },
      },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca um item de checklist pelo ID.
  async findById(id: number) {
    return prisma.checklistItem.findUnique({
      where: { id },
    });
  }

  // Cria um novo item de checklist.
  async create(data: ChecklistItemData & { title: string; taskId: number }) {
    return prisma.checklistItem.create({
      data,
    });
  }

  // Atualiza um item de checklist existente.
  async update(id: number, data: ChecklistItemData) {
    return prisma.checklistItem.update({
      where: { id },
      data,
    });
  }

  // Remove um item de checklist.
  async delete(id: number) {
    return prisma.checklistItem.delete({
      where: { id },
    });
  }
}

export default new ChecklistItemRepository();
