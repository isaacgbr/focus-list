import archiveRepository from "../repositories/archive.repository.js";
import { HttpError } from "../utils/http-error.js";

class ArchiveService {
  async findAll(userId: number) {
    return archiveRepository.findAll(userId);
  }

  async findAreaById(userId: number, id: number) {
    const area = await archiveRepository.findAreaById(userId, id);
    if (!area) throw new HttpError(404, "Área arquivada não encontrada.");
    return area;
  }

  async findListById(userId: number, id: number) {
    const list = await archiveRepository.findListById(userId, id);
    if (!list) throw new HttpError(404, "Lista arquivada não encontrada.");
    return list;
  }

  async findTaskById(userId: number, id: number) {
    const task = await archiveRepository.findTaskById(userId, id);
    if (!task) throw new HttpError(404, "Tarefa arquivada não encontrada.");
    return task;
  }
}

export default new ArchiveService();
