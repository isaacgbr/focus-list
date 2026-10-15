import areaRepository from "../repositories/area.repository.js";

class AreaService {
  // Lista todas as Áreas.
  async findAll() {
    return areaRepository.findAll();
  }

  // Busca uma Área pelo ID.
  async findById(id: number) {
    const area = await areaRepository.findById(id);

    if (!area) {
      throw new Error("Área não encontrada.");
    }

    return area;
  }

  // Cria uma nova Área.
  async create(data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    if (!data.title.trim()) {
      throw new Error("O título da Área é obrigatório.");
    }

    return areaRepository.create(data);
  }

  // Atualiza uma Área.
  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      color?: string;
      icon?: string;
    }
  ) {
    const area = await areaRepository.findAnyById(id);

    if (!area) {
      throw new Error("Área não encontrada.");
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new Error("O título da Área é obrigatório.");
    }

    return areaRepository.update(id, data);
  }

  // Exclui uma Área.
  async delete(id: number) {
    const area = await areaRepository.findAnyById(id);

    if (!area) throw new Error("Área não encontrada.");
    if (!area.archivedAt) throw new Error("A Área deve ser arquivada antes da exclusão definitiva.");

    return areaRepository.delete(id);
  }

  async archive(id: number) {
    await this.findById(id);
    return areaRepository.archive(id);
  }

  async restore(id: number) {
    const area = await areaRepository.findAnyById(id);
    if (!area) throw new Error("Área não encontrada.");
    if (!area.archivedAt) throw new Error("A Área não está arquivada.");
    return areaRepository.restore(id);
  }
}

export default new AreaService();
