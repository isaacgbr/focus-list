import prisma from "../config/prisma.js";

class ListRepository {
  // Retorna todas as Listas ordenadas por título.
  async findAll(userId: number, areaId?: number) {
    return prisma.list.findMany({
      where: { AND: [{ area: { userId } }], archivedAt: null, areaId, area: { archivedAt: null } },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Lista pelo ID.
  async findById(userId: number, id: number) {
    return prisma.list.findFirst({
      where: { AND: [{ area: { userId } }], id, archivedAt: null, area: { archivedAt: null } },
    });
  }

  async findAnyById(userId: number, id: number) {
    return prisma.list.findUnique({ where: { AND: [{ area: { userId } }], id }, include: { area: true } });
  }

  // Cria uma nova Lista.
  async create(userId: number, data: {
    title: string;
    description?: string | null;
    areaId: number;
  }) {
    return prisma.list.create({
      // Aceita somente campos do recurso, sem escritas aninhadas de propriedade.
      data: {
        title: data.title,
        description: data.description,
        area: { connect: { id: data.areaId, AND: [{ userId }] } },
      },
    });
  }

  // Atualiza uma Lista existente.
  async update(
    userId: number,
    id: number,
    data: {
      title?: string;
      description?: string | null;
      areaId?: number;
    }
  ) {
    return prisma.list.update({
      where: { AND: [{ area: { userId } }], id },
      data: {
        title: data.title,
        description: data.description,
        area: data.areaId === undefined ? undefined : { connect: { id: data.areaId, AND: [{ userId }] } },
      },
    });
  }

  // Remove uma Lista.
  async delete(userId: number, id: number) {
    return prisma.list.delete({
      where: { AND: [{ area: { userId } }], id },
    });
  }

  async archive(userId: number, id: number) {
    return prisma.list.update({ where: { AND: [{ area: { userId } }], id }, data: { archivedAt: new Date() } });
  }

  async restore(userId: number, id: number) {
    return prisma.list.update({ where: { AND: [{ area: { userId } }], id }, data: { archivedAt: null } });
  }
}

export default new ListRepository();
