import listRepository from "../repositories/list.repository.js";
import taskRepository from "../repositories/task.repository.js";

type TaskData = {
  title?: string;
  description?: string;
  dueDate?: Date | string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  completed?: boolean;
  completedAt?: Date | string | null;
  listId?: number;
};

class TaskService {
  // Lista todas as Tarefas.
  async findAll() {
    return taskRepository.findAll();
  }

  // Busca uma Tarefa pelo ID.
  async findById(id: number) {
    const task = await taskRepository.findById(id);

    if (!task) {
      throw new Error("Tarefa não encontrada.");
    }

    return task;
  }

  // Cria uma nova Tarefa.
  async create(data: TaskData & { title: string; listId: number }) {
    if (!data.title.trim()) {
      throw new Error("O título da Tarefa é obrigatório.");
    }

    const list = await listRepository.findById(data.listId);

    if (!list) {
      throw new Error("Lista não encontrada.");
    }

    return taskRepository.create(data);
  }

  // Atualiza uma Tarefa.
  async update(id: number, data: TaskData) {
    const task = await taskRepository.findAnyById(id);

    if (!task) {
      throw new Error("Tarefa não encontrada.");
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new Error("O título da Tarefa é obrigatório.");
    }

    if (data.listId !== undefined) {
      const list = await listRepository.findById(data.listId);

      if (!list) {
        throw new Error("Lista não encontrada.");
      }
    }

    const updateData = { ...data };
    delete updateData.completedAt;

    if (data.completed !== undefined) {
      updateData.completedAt = data.completed ? new Date() : null;
    }

    return taskRepository.update(id, updateData);
  }

  // Exclui uma Tarefa.
  async delete(id: number) {
    const task = await taskRepository.findAnyById(id);

    if (!task) throw new Error("Tarefa não encontrada.");
    if (!task.archivedAt) throw new Error("A Tarefa deve ser arquivada antes da exclusão definitiva.");

    return taskRepository.delete(id);
  }

  async archive(id: number) {
    await this.findById(id);
    return taskRepository.archive(id);
  }

  async restore(id: number) {
    const task = await taskRepository.findAnyById(id);
    if (!task) throw new Error("Tarefa não encontrada.");
    if (!task.archivedAt) throw new Error("A Tarefa não está arquivada.");
    if (task.list.archivedAt || task.list.area.archivedAt) {
      throw new Error("Restaure a Área e a Lista antes de restaurar esta Tarefa.");
    }
    return taskRepository.restore(id);
  }
}

export default new TaskService();
