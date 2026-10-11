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
    await this.findById(id);

    return areaRepository.update(id, data);
  }

  // Exclui uma Área.
  async delete(id: number) {
    await this.findById(id);

    return areaRepository.delete(id);
  }
}

export default new AreaService();