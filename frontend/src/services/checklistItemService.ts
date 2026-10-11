import api from "./api";

export type ChecklistItem = {
  id: number;
  title: string;
  completed: boolean;
  taskId: number;
  createdAt: string;
};

export type CreateChecklistItemData = {
  title: string;
  completed?: boolean;
  taskId: number;
};

export type UpdateChecklistItemData = Partial<CreateChecklistItemData>;

const checklistItemService = {
  async getAll() {
    const { data } = await api.get<ChecklistItem[]>("/checklist-items");
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<ChecklistItem>(`/checklist-items/${id}`);
    return data;
  },

  async create(payload: CreateChecklistItemData) {
    const { data } = await api.post<ChecklistItem>("/checklist-items", payload);
    return data;
  },

  async update(id: number, payload: UpdateChecklistItemData) {
    const { data } = await api.put<ChecklistItem>(
      `/checklist-items/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: number) {
    await api.delete(`/checklist-items/${id}`);
  },
};

export default checklistItemService;
