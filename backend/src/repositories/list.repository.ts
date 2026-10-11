import prisma from "../config/prisma.js";

class ListRepository {
  // Retorna todas as Listas ordenadas por título.
  async findAll() {
    return prisma.list.findMany({
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca uma Lista pelo ID.
  async findById(id: number) {
    return prisma.list.findUnique({
      where: { id },
    });
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
}

export default new ListRepository();
