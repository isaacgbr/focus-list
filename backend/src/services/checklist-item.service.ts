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
  async findAll() {
    return checklistItemRepository.findAll();
  }

  // Busca um item de checklist pelo ID.
  async findById(id: number) {
    const checklistItem = await checklistItemRepository.findById(id);

    if (!checklistItem) {
      throw new Error("Item de checklist não encontrado.");
    }

    return checklistItem;
  }

  // Cria um novo item de checklist.
  async create(data: ChecklistItemData & { taskId: number }) {
    const title = data.title ?? data.text;

    if (!title?.trim()) {
      throw new Error("O título do item de checklist é obrigatório.");
    }

    const task = await taskRepository.findById(data.taskId);

    if (!task) {
      throw new Error("Tarefa não encontrada.");
    }

    return checklistItemRepository.create({
      title,
      completed: data.completed,
      taskId: data.taskId,
    });
  }

  // Atualiza um item de checklist.
  async update(id: number, data: ChecklistItemData) {
    const checklistItem = await this.findById(id);
    const currentTask = await taskRepository.findById(checklistItem.taskId);

    if (!currentTask) {
      throw new Error("Não é possível alterar o conteúdo de uma tarefa arquivada.");
    }

    const title = data.title ?? data.text;

    if (data.taskId !== undefined) {
      const task = await taskRepository.findById(data.taskId);

      if (!task) {
        throw new Error("Tarefa não encontrada.");
      }
    }

    return checklistItemRepository.update(id, {
      title,
      completed: data.completed,
      taskId: data.taskId,
    });
  }

  // Exclui um item de checklist.
  async delete(id: number) {
    const checklistItem = await this.findById(id);
    const task = await taskRepository.findById(checklistItem.taskId);

    if (!task) {
      throw new Error("Não é possível alterar o conteúdo de uma tarefa arquivada.");
    }

    return checklistItemRepository.delete(id);
  }
}

export default new ChecklistItemService();
