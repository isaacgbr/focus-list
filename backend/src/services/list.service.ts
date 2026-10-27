import { HttpError } from "../utils/http-error.js";
import areaRepository from "../repositories/area.repository.js";
import listRepository from "../repositories/list.repository.js";

class ListService {
  // Lista todas as Listas.
  async findAll(userId: number, areaId?: number) {
    return listRepository.findAll(userId, areaId);
  }

  // Busca uma Lista pelo ID.
  async findById(userId: number, id: number) {
    const list = await listRepository.findById(userId, id);

    if (!list) {
      throw new HttpError(404, "Lista não encontrada.");
    }

    return list;
  }

  // Cria uma nova Lista.
  async create(userId: number, data: {
    title: string;
    description?: string | null;
    areaId: number;
  }) {
    if (!data.title.trim()) {
      throw new HttpError(400, "O título da Lista é obrigatório.");
    }

    const area = await areaRepository.findById(userId, data.areaId);

    if (!area) {
      throw new HttpError(404, "Área não encontrada.");
    }

    return listRepository.create(userId, data);
  }

  // Atualiza uma Lista.
  async update(
    userId: number,
    id: number,
    data: {
      title?: string;
      description?: string | null;
      areaId?: number;
    }
  ) {
    const list = await listRepository.findAnyById(userId, id);

    if (!list) {
      throw new HttpError(404, "Lista não encontrada.");
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new HttpError(400, "O título da Lista é obrigatório.");
    }

    if (data.areaId !== undefined) {
      const area = await areaRepository.findById(userId, data.areaId);

      if (!area) {
        throw new HttpError(404, "Área não encontrada.");
      }
    }

    return listRepository.update(userId, id, data);
  }

  // Exclui uma Lista.
  async delete(userId: number, id: number) {
    const list = await listRepository.findAnyById(userId, id);

    if (!list) throw new HttpError(404, "Lista não encontrada.");
    if (!list.archivedAt) throw new HttpError(400, "A Lista deve ser arquivada antes da exclusão definitiva.");

    return listRepository.delete(userId, id);
  }

  async archive(userId: number, id: number) {
    await this.findById(userId, id);
    return listRepository.archive(userId, id);
  }

  async restore(userId: number, id: number) {
    const list = await listRepository.findAnyById(userId, id);
    if (!list) throw new HttpError(404, "Lista não encontrada.");
    if (!list.archivedAt) throw new HttpError(400, "A Lista não está arquivada.");
    if (list.area.archivedAt) throw new HttpError(400, "Restaure a Área antes de restaurar esta Lista.");
    return listRepository.restore(userId, id);
  }
}

export default new ListService();
