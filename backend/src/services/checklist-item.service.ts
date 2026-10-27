import { HttpError } from "../utils/http-error.js";
import checklistItemRepository from "../repositories/checklist-item.repository.js";
import taskRepository from "../repositories/task.repository.js";

type ChecklistItemData = {
  title?: string;
  text?: string;
  completed?: boolean;
  taskId?: number;
};

class ChecklistItemService {
  // Lista todos os itens de checklist.
  async findAll(userId: number, filters: { taskId?: number; listId?: number } = {}) {
    return checklistItemRepository.findAll(userId, filters);
  }

  // Busca um item de checklist pelo ID.
  async findById(userId: number, id: number) {
    const checklistItem = await checklistItemRepository.findById(userId, id);

    if (!checklistItem) {
      throw new HttpError(404, "Item de checklist não encontrado.");
    }

    return checklistItem;
  }

  // Cria um novo item de checklist.
  async create(userId: number, data: ChecklistItemData & { taskId: number }) {
    const title = data.title ?? data.text;

    if (!title?.trim()) {
      throw new HttpError(400, "O título do item de checklist é obrigatório.");
    }

    const task = await taskRepository.findAnyById(userId, data.taskId);

    if (!task) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    return checklistItemRepository.create(userId, {
      title,
      completed: data.completed,
      taskId: data.taskId,
    });
  }

  // Atualiza um item de checklist.
  async update(userId: number, id: number, data: ChecklistItemData) {
    const checklistItem = await this.findById(userId, id);
    const currentTask = await taskRepository.findAnyById(userId, checklistItem.taskId);

    if (!currentTask) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    const title = data.title ?? data.text;

    if (title !== undefined && !title.trim()) {
      throw new HttpError(400, "O título do item de checklist é obrigatório.");
    }

    if (data.taskId !== undefined) {
      const task = await taskRepository.findAnyById(userId, data.taskId);

      if (!task) {
        throw new HttpError(404, "Tarefa não encontrada.");
      }
    }

    return checklistItemRepository.update(userId, id, {
      title,
      completed: data.completed,
      taskId: data.taskId,
    });
  }

  // Exclui um item de checklist.
  async delete(userId: number, id: number) {
    const checklistItem = await this.findById(userId, id);
    const task = await taskRepository.findAnyById(userId, checklistItem.taskId);

    if (!task) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    return checklistItemRepository.delete(userId, id);
  }
}

export default new ChecklistItemService();
