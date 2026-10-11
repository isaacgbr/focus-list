import api from "./api";

export type List = {
  id: number;
  title: string;
  description: string | null;
  areaId: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateListData = {
  title: string;
  description?: string;
  areaId: number;
};

export type UpdateListData = Partial<CreateListData>;

const listService = {
  async getAll() {
    const { data } = await api.get<List[]>("/lists");
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<List>(`/lists/${id}`);
    return data;
  },

  async create(payload: CreateListData) {
    const { data } = await api.post<List>("/lists", payload);
    return data;
  },

  async update(id: number, payload: UpdateListData) {
    const { data } = await api.put<List>(`/lists/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    await api.delete(`/lists/${id}`);
  },
};

export default listService;
