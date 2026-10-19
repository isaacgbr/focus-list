import api from "./api";

function notifyDataChanged() {
  window.dispatchEvent(new Event("focuslist:data-changed"));
}

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
  async getAll(filters: { taskId?: number; listId?: number } = {}) {
    const { data } = await api.get<ChecklistItem[]>("/checklist-items", { params: filters });
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<ChecklistItem>(`/checklist-items/${id}`);
    return data;
  },

  async create(payload: CreateChecklistItemData) {
    const { data } = await api.post<ChecklistItem>("/checklist-items", payload);
    notifyDataChanged();
    return data;
  },

  async update(id: number, payload: UpdateChecklistItemData) {
    const { data } = await api.put<ChecklistItem>(
      `/checklist-items/${id}`,
      payload,
    );
    notifyDataChanged();
    return data;
  },

  async remove(id: number) {
    await api.delete(`/checklist-items/${id}`);
    notifyDataChanged();
  },
};

export default checklistItemService;
