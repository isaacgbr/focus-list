import prisma from "../config/prisma.js";

class AreaRepository {
  // Retorna todas as Áreas ordenadas por título.
  async findAll() {
    return prisma.area.findMany({
      where: { archivedAt: null },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Área pelo ID.
  async findById(id: number) {
    return prisma.area.findFirst({
      where: { id, archivedAt: null },
    });
  }

  async findAnyById(id: number) {
    return prisma.area.findUnique({ where: { id } });
  }

  // Cria uma nova Área.
  async create(data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    return prisma.area.create({
      data,
    });
  }

  // Atualiza uma Área existente.
  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      color?: string;
      icon?: string;
    }
  ) {
    return prisma.area.update({
      where: { id },
      data,
    });
  }

  // Remove uma Área.
  async delete(id: number) {
    return prisma.area.delete({
      where: { id },
    });
  }

  async archive(id: number) {
    return prisma.area.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async restore(id: number) {
    return prisma.area.update({ where: { id }, data: { archivedAt: null } });
  }
}

export default new AreaRepository();
