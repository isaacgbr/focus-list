import archiveRepository from "../repositories/archive.repository.js";

class ArchiveService {
  async findAll() {
    return archiveRepository.findAll();
  }

  async findAreaById(id: number) {
    const area = await archiveRepository.findAreaById(id);
    if (!area) throw new Error("Área arquivada não encontrada.");
    return area;
  }

  async findListById(id: number) {
    const list = await archiveRepository.findListById(id);
    if (!list) throw new Error("Lista arquivada não encontrada.");
    return list;
  }

  async findTaskById(id: number) {
    const task = await archiveRepository.findTaskById(id);
    if (!task) throw new Error("Tarefa arquivada não encontrada.");
    return task;
  }
}

export default new ArchiveService();
