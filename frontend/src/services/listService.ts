import api from "./api";

function notifyDataChanged() {
  window.dispatchEvent(new Event("focuslist:data-changed"));
}

export type List = {
  id: number;
  title: string;
  description: string | null;
  areaId: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type CreateListData = {
  title: string;
  description?: string;
  areaId: number;
};

export type UpdateListData = Partial<CreateListData>;

const listService = {
  async getAll(filters: { areaId?: number } = {}) {
    const { data } = await api.get<List[]>("/lists", { params: filters });
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<List>(`/lists/${id}`);
    return data;
  },

  async create(payload: CreateListData) {
    const { data } = await api.post<List>("/lists", payload);
    notifyDataChanged();
    return data;
  },

  async update(id: number, payload: UpdateListData) {
    const { data } = await api.put<List>(`/lists/${id}`, payload);
    notifyDataChanged();
    return data;
  },

  async remove(id: number) {
    await api.delete(`/lists/${id}`);
    notifyDataChanged();
  },

  async archive(id: number) {
    const { data } = await api.patch<List>(`/lists/${id}/archive`);
    notifyDataChanged();
    return data;
  },

  async restore(id: number) {
    const { data } = await api.patch<List>(`/lists/${id}/restore`);
    notifyDataChanged();
    return data;
  },
};

export default listService;
