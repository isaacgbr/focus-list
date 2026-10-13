import api from "./api";

function notifyDataChanged() {
  window.dispatchEvent(new Event("focuslist:data-changed"));
}

export type Area = {
  id: number;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type CreateAreaData = {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
};

export type UpdateAreaData = Partial<CreateAreaData>;

const areaService = {
  async getAll() {
    const { data } = await api.get<Area[]>("/areas");
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<Area>(`/areas/${id}`);
    return data;
  },

  async create(payload: CreateAreaData) {
    const { data } = await api.post<Area>("/areas", payload);
    notifyDataChanged();
    return data;
  },

  async update(id: number, payload: UpdateAreaData) {
    const { data } = await api.put<Area>(`/areas/${id}`, payload);
    notifyDataChanged();
    return data;
  },

  async remove(id: number) {
    await api.delete(`/areas/${id}`);
    notifyDataChanged();
  },

  async archive(id: number) {
    const { data } = await api.patch<Area>(`/areas/${id}/archive`);
    notifyDataChanged();
    return data;
  },

  async restore(id: number) {
    const { data } = await api.patch<Area>(`/areas/${id}/restore`);
    notifyDataChanged();
    return data;
  },
};

export default areaService;
