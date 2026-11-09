import { HttpError } from "../utils/http-error.js";
import linkRepository from "../repositories/link.repository.js";
import taskRepository from "../repositories/task.repository.js";

type LinkData = {
  title?: string;
  url?: string;
  taskId?: number;
};

function validateUrl(value: string) {
  if (!value.trim()) throw new HttpError(400, "A URL do Link é obrigatória.");
  try {
    const url = new URL(value);
    if (/^https?:\/\//i.test(value.trim()) && (url.protocol === "http:" || url.protocol === "https:")) return;
  } catch { /* Responde com o mesmo erro para formato ou protocolo inválido. */ }
  throw new HttpError(400, "Informe uma URL válida iniciada por http:// ou https://.");
}

class LinkService {
  // Lista todos os Links.
  async findAll(userId: number, filters: { taskId?: number; listId?: number } = {}) {
    return linkRepository.findAll(userId, filters);
  }

  // Busca um Link pelo ID.
  async findById(userId: number, id: number) {
    const link = await linkRepository.findById(userId, id);

    if (!link) {
      throw new HttpError(404, "Link não encontrado.");
    }

    return link;
  }

  // Cria um novo Link.
  async create(userId: number, data: LinkData & { title: string; url: string; taskId: number }) {
    if (!data.title.trim()) {
      throw new HttpError(400, "O título do Link é obrigatório.");
    }

    validateUrl(data.url);

    const task = await taskRepository.findAnyById(userId, data.taskId);

    if (!task) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    return linkRepository.create(userId, data);
  }

  // Atualiza um Link.
  async update(userId: number, id: number, data: LinkData) {
    const link = await this.findById(userId, id);
    const currentTask = await taskRepository.findAnyById(userId, link.taskId);

    if (!currentTask) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new HttpError(400, "O título do Link é obrigatório.");
    }

    if (data.url !== undefined) validateUrl(data.url);

    if (data.taskId !== undefined) {
      const task = await taskRepository.findAnyById(userId, data.taskId);

      if (!task) {
        throw new HttpError(404, "Tarefa não encontrada.");
      }
    }

    return linkRepository.update(userId, id, data);
  }

  // Exclui um Link.
  async delete(userId: number, id: number) {
    const link = await this.findById(userId, id);
    const task = await taskRepository.findAnyById(userId, link.taskId);

    if (!task) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    return linkRepository.delete(userId, id);
  }
}

export default new LinkService();
