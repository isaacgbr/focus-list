import prisma from "../config/prisma.js";

type LinkData = {
  title?: string;
  url?: string;
  taskId?: number;
};

class LinkRepository {
  // Retorna todos os Links ordenados por título.
  async findAll() {
    return prisma.link.findMany({
      orderBy: {
        title: "asc",
      },
    });
  }

  // Busca um Link pelo ID.
  async findById(id: number) {
    return prisma.link.findUnique({
      where: { id },
    });
  }

  // Cria um novo Link.
  async create(data: LinkData & { title: string; url: string; taskId: number }) {
    return prisma.link.create({
      data,
    });
  }

  // Atualiza um Link existente.
  async update(id: number, data: LinkData) {
    return prisma.link.update({
      where: { id },
      data,
    });
  }

  // Remove um Link.
  async delete(id: number) {
    return prisma.link.delete({
      where: { id },
    });
  }
}

export default new LinkRepository();
