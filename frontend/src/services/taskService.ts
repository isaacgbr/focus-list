import api from "./api";

function notifyDataChanged() {
  window.dispatchEvent(new Event("focuslist:data-changed"));
}

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  completed: boolean;
  completedAt: string | null;
  listId: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type CreateTaskData = {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  completed?: boolean;
  completedAt?: string;
  listId: number;
};

export type UpdateTaskData = Partial<Omit<CreateTaskData, "description" | "dueDate" | "priority" | "completedAt">> & {
  description?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority | null;
  completedAt?: string | null;
};

const taskService = {
  async getAll(filters: { listId?: number; areaId?: number } = {}) {
    const { data } = await api.get<Task[]>("/tasks", { params: filters });
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<Task>(`/tasks/${id}`);
    return data;
  },

  async create(payload: CreateTaskData) {
    const { data } = await api.post<Task>("/tasks", payload);
    notifyDataChanged();
    return data;
  },

  async update(id: number, payload: UpdateTaskData) {
    const { data } = await api.put<Task>(`/tasks/${id}`, payload);
    notifyDataChanged();
    return data;
  },

  async remove(id: number) {
    await api.delete(`/tasks/${id}`);
    notifyDataChanged();
  },

  async archive(id: number) {
    const { data } = await api.patch<Task>(`/tasks/${id}/archive`);
    notifyDataChanged();
    return data;
  },

  async restore(id: number) {
    const { data } = await api.patch<Task>(`/tasks/${id}/restore`);
    notifyDataChanged();
    return data;
  },
};

export default taskService;
