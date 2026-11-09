import { HttpError } from "../utils/http-error.js";
import listRepository from "../repositories/list.repository.js";
import taskRepository from "../repositories/task.repository.js";

type TaskData = {
  title?: string;
  description?: string | null;
  dueDate?: Date | string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  completed?: boolean;
  completedAt?: Date | string | null;
  listId?: number;
};

class TaskService {
  // Lista todas as Tarefas.
  async findAll(userId: number, filters: { listId?: number; areaId?: number } = {}) {
    return taskRepository.findAll(userId, filters);
  }

  // Busca uma Tarefa pelo ID.
  async findById(userId: number, id: number) {
    const task = await taskRepository.findById(userId, id);

    if (!task) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    return task;
  }

  // Cria uma nova Tarefa.
  async create(userId: number, data: TaskData & { title: string; listId: number }) {
    if (!data.title.trim()) {
      throw new HttpError(400, "O título da Tarefa é obrigatório.");
    }

    const list = await listRepository.findById(userId, data.listId);

    if (!list) {
      throw new HttpError(404, "Lista não encontrada.");
    }

    return taskRepository.create(userId, {
      ...data,
      completedAt: data.completed ? new Date() : null,
    });
  }

  // Atualiza uma Tarefa.
  async update(userId: number, id: number, data: TaskData) {
    const task = await taskRepository.findAnyById(userId, id);

    if (!task) {
      throw new HttpError(404, "Tarefa não encontrada.");
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new HttpError(400, "O título da Tarefa é obrigatório.");
    }

    if (data.listId !== undefined) {
      const list = await listRepository.findById(userId, data.listId);

      if (!list) {
        throw new HttpError(404, "Lista não encontrada.");
      }
    }

    const updateData = { ...data };
    delete updateData.completedAt;

    if (data.completed !== undefined) {
      updateData.completedAt = data.completed ? new Date() : null;
    }

    return taskRepository.update(userId, id, updateData);
  }

  // Exclui uma Tarefa.
  async delete(userId: number, id: number) {
    const task = await taskRepository.findAnyById(userId, id);

    if (!task) throw new HttpError(404, "Tarefa não encontrada.");
    if (!task.archivedAt) throw new HttpError(400, "A Tarefa deve ser arquivada antes da exclusão definitiva.");

    return taskRepository.delete(userId, id);
  }

  async archive(userId: number, id: number) {
    await this.findById(userId, id);
    return taskRepository.archive(userId, id);
  }

  async restore(userId: number, id: number) {
    const task = await taskRepository.findAnyById(userId, id);
    if (!task) throw new HttpError(404, "Tarefa não encontrada.");
    if (!task.archivedAt) throw new HttpError(400, "A Tarefa não está arquivada.");
    if (task.list.archivedAt || task.list.area.archivedAt) {
      throw new HttpError(400, "Restaure a Área e a Lista antes de restaurar esta Tarefa.");
    }
    return taskRepository.restore(userId, id);
  }
}

export default new TaskService();
