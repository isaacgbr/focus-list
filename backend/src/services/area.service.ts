import { HttpError } from "../utils/http-error.js";
import areaRepository from "../repositories/area.repository.js";

class AreaService {
  // Lista todas as Áreas.
  async findAll(userId: number) {
    return areaRepository.findAll(userId);
  }

  // Busca uma Área pelo ID.
  async findById(userId: number, id: number) {
    const area = await areaRepository.findById(userId, id);

    if (!area) {
      throw new HttpError(404, "Área não encontrada.");
    }

    return area;
  }

  // Cria uma nova Área.
  async create(userId: number, data: {
    title: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
  }) {
    if (!data.title.trim()) {
      throw new HttpError(400, "O título da Área é obrigatório.");
    }

    return areaRepository.create(userId, data);
  }

  // Atualiza uma Área.
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
    const area = await areaRepository.findAnyById(userId, id);

    if (!area) {
      throw new HttpError(404, "Área não encontrada.");
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new HttpError(400, "O título da Área é obrigatório.");
    }

    return areaRepository.update(userId, id, data);
  }

  // Exclui uma Área.
  async delete(userId: number, id: number) {
    const area = await areaRepository.findAnyById(userId, id);

    if (!area) throw new HttpError(404, "Área não encontrada.");
    if (!area.archivedAt) throw new HttpError(400, "A Área deve ser arquivada antes da exclusão definitiva.");

    return areaRepository.delete(userId, id);
  }

  async archive(userId: number, id: number) {
    await this.findById(userId, id);
    return areaRepository.archive(userId, id);
  }

  async restore(userId: number, id: number) {
    const area = await areaRepository.findAnyById(userId, id);
    if (!area) throw new HttpError(404, "Área não encontrada.");
    if (!area.archivedAt) throw new HttpError(400, "A Área não está arquivada.");
    return areaRepository.restore(userId, id);
  }
}

export default new AreaService();
