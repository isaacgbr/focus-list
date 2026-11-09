import prisma from "../config/prisma.js";

class AreaRepository {
  // Retorna todas as Áreas ordenadas por título.
  async findAll(userId: number) {
    return prisma.area.findMany({
      where: { AND: [{ userId }], archivedAt: null },
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Área pelo ID.
  async findById(userId: number, id: number) {
    return prisma.area.findFirst({
      where: { AND: [{ userId }], id, archivedAt: null },
    });
  }

  async findAnyById(userId: number, id: number) {
    return prisma.area.findUnique({ where: { AND: [{ userId }], id } });
  }

  // Cria uma nova Área.
  async create(userId: number, data: {
    title: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
  }) {
    return prisma.area.create({
      // O corpo HTTP não pode definir propriedade nem executar escritas aninhadas.
      data: {
        userId,
        title: data.title,
        description: data.description,
        color: data.color,
        icon: data.icon,
      },
    });
  }

  // Atualiza uma Área existente.
  async update(
    userId: number,
    id: number,
    data: {
      title?: string;
      description?: string | null;
      color?: string | null;
      icon?: string | null;
    }
  ) {
    return prisma.area.update({
      where: { AND: [{ userId }], id },
      data: {
        title: data.title,
        description: data.description,
        color: data.color,
        icon: data.icon,
      },
    });
  }

  // Remove uma Área.
  async delete(userId: number, id: number) {
    return prisma.area.delete({
      // Revalida na escrita: uma restauração concorrente impede a exclusão.
      where: { AND: [{ userId }], id, archivedAt: { not: null } },
    });
  }

  async archive(userId: number, id: number) {
    return prisma.area.update({ where: { AND: [{ userId }], id }, data: { archivedAt: new Date() } });
  }

  async restore(userId: number, id: number) {
    return prisma.area.update({ where: { AND: [{ userId }], id }, data: { archivedAt: null } });
  }
}

export default new AreaRepository();
