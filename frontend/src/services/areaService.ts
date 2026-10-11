import api from "./api";

export type Area = {
  id: number;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
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
    return data;
  },

  async update(id: number, payload: UpdateAreaData) {
    const { data } = await api.put<Area>(`/areas/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    await api.delete(`/areas/${id}`);
  },
};

export default areaService;
