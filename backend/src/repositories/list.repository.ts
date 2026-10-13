import prisma from "../config/prisma.js";

class ListRepository {
  // Retorna todas as Listas ordenadas por título.
  async findAll() {
    return prisma.list.findMany({
      where: { archivedAt: null, area: { archivedAt: null } },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Lista pelo ID.
  async findById(id: number) {
    return prisma.list.findFirst({
      where: { id, archivedAt: null, area: { archivedAt: null } },
    });
  }

  async findAnyById(id: number) {
    return prisma.list.findUnique({ where: { id }, include: { area: true } });
  }

  // Cria uma nova Lista.
  async create(data: {
    title: string;
    description?: string;
    areaId: number;
  }) {
    return prisma.list.create({
      data,
    });
  }

  // Atualiza uma Lista existente.
  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      areaId?: number;
    }
  ) {
    return prisma.list.update({
      where: { id },
      data,
    });
  }

  // Remove uma Lista.
  async delete(id: number) {
    return prisma.list.delete({
      where: { id },
    });
  }

  async archive(id: number) {
    return prisma.list.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async restore(id: number) {
    return prisma.list.update({ where: { id }, data: { archivedAt: null } });
  }
}

export default new ListRepository();
