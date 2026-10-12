import api from "./api";

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
  async getAll() {
    const { data } = await api.get<Task[]>("/tasks");
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<Task>(`/tasks/${id}`);
    return data;
  },

  async create(payload: CreateTaskData) {
    const { data } = await api.post<Task>("/tasks", payload);
    return data;
  },

  async update(id: number, payload: UpdateTaskData) {
    const { data } = await api.put<Task>(`/tasks/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    await api.delete(`/tasks/${id}`);
  },
};

export default taskService;
