import prisma from "../config/prisma.js";

type LinkData = {
  title?: string;
  url?: string;
  taskId?: number;
};

class LinkRepository {
  // Retorna todos os Links ordenados por título.
  async findAll(userId: number, { taskId, listId }: { taskId?: number; listId?: number } = {}) {
    return prisma.link.findMany({
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

  // Busca um Link pelo ID.
  async findById(userId: number, id: number) {
    return prisma.link.findUnique({
      where: { AND: [{ task: { list: { area: { userId } } } }], id },
    });
  }

  // Cria um novo Link.
  async create(userId: number, data: LinkData & { title: string; url: string; taskId: number }) {
    return prisma.link.create({
      // Aceita somente campos do recurso, sem escritas aninhadas de propriedade.
      data: {
        title: data.title,
        url: data.url,
        task: { connect: { id: data.taskId, AND: [{ list: { area: { userId } } }] } },
      },
    });
  }

  // Atualiza um Link existente.
  async update(userId: number, id: number, data: LinkData) {
    return prisma.link.update({
      where: { AND: [{ task: { list: { area: { userId } } } }], id },
      data: {
        title: data.title,
        url: data.url,
        task: data.taskId === undefined ? undefined : { connect: { id: data.taskId, AND: [{ list: { area: { userId } } }] } },
      },
    });
  }

  // Remove um Link.
  async delete(userId: number, id: number) {
    return prisma.link.delete({
      where: { AND: [{ task: { list: { area: { userId } } } }], id },
    });
  }
}

export default new LinkRepository();
