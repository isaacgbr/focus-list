import linkRepository from "../repositories/link.repository.js";
import taskRepository from "../repositories/task.repository.js";

type LinkData = {
  title?: string;
  url?: string;
  taskId?: number;
};

class LinkService {
  // Lista todos os Links.
  async findAll() {
    return linkRepository.findAll();
  }

  // Busca um Link pelo ID.
  async findById(id: number) {
    const link = await linkRepository.findById(id);

    if (!link) {
      throw new Error("Link não encontrado.");
    }

    return link;
  }

  // Cria um novo Link.
  async create(data: LinkData & { title: string; url: string; taskId: number }) {
    if (!data.title.trim()) {
      throw new Error("O título do Link é obrigatório.");
    }

    if (!data.url.trim()) {
      throw new Error("A URL do Link é obrigatória.");
    }

    const task = await taskRepository.findById(data.taskId);

    if (!task) {
      throw new Error("Tarefa não encontrada.");
    }

    return linkRepository.create(data);
  }

  // Atualiza um Link.
  async update(id: number, data: LinkData) {
    await this.findById(id);

    if (data.taskId !== undefined) {
      const task = await taskRepository.findById(data.taskId);

      if (!task) {
        throw new Error("Tarefa não encontrada.");
      }
    }

    return linkRepository.update(id, data);
  }

  // Exclui um Link.
  async delete(id: number) {
    await this.findById(id);

    return linkRepository.delete(id);
  }
}

export default new LinkService();
