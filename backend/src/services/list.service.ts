import areaRepository from "../repositories/area.repository.js";
import listRepository from "../repositories/list.repository.js";

class ListService {
  // Lista todas as Listas.
  async findAll() {
    return listRepository.findAll();
  }

  // Busca uma Lista pelo ID.
  async findById(id: number) {
    const list = await listRepository.findById(id);

    if (!list) {
      throw new Error("Lista não encontrada.");
    }

    return list;
  }

  // Cria uma nova Lista.
  async create(data: {
    title: string;
    description?: string;
    areaId: number;
  }) {
    if (!data.title.trim()) {
      throw new Error("O título da Lista é obrigatório.");
    }

    const area = await areaRepository.findById(data.areaId);

    if (!area) {
      throw new Error("Área não encontrada.");
    }

    return listRepository.create(data);
  }

  // Atualiza uma Lista.
  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      areaId?: number;
    }
  ) {
    const list = await listRepository.findAnyById(id);

    if (!list) {
      throw new Error("Lista não encontrada.");
    }

    if (data.areaId !== undefined) {
      const area = await areaRepository.findById(data.areaId);

      if (!area) {
        throw new Error("Área não encontrada.");
      }
    }

    return listRepository.update(id, data);
  }

  // Exclui uma Lista.
  async delete(id: number) {
    const list = await listRepository.findAnyById(id);

    if (!list) throw new Error("Lista não encontrada.");
    if (!list.archivedAt) throw new Error("A Lista deve ser arquivada antes da exclusão definitiva.");

    return listRepository.delete(id);
  }

  async archive(id: number) {
    await this.findById(id);
    return listRepository.archive(id);
  }

  async restore(id: number) {
    const list = await listRepository.findAnyById(id);
    if (!list) throw new Error("Lista não encontrada.");
    if (!list.archivedAt) throw new Error("A Lista não está arquivada.");
    if (list.area.archivedAt) throw new Error("Restaure a Área antes de restaurar esta Lista.");
    return listRepository.restore(id);
  }
}

export default new ListService();
