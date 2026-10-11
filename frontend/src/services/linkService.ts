import api from "./api";

export type Link = {
  id: number;
  title: string;
  url: string;
  taskId: number;
  createdAt: string;
};

export type CreateLinkData = {
  title: string;
  url: string;
  taskId: number;
};

export type UpdateLinkData = Partial<CreateLinkData>;

const linkService = {
  async getAll() {
    const { data } = await api.get<Link[]>("/links");
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get<Link>(`/links/${id}`);
    return data;
  },

  async create(payload: CreateLinkData) {
    const { data } = await api.post<Link>("/links", payload);
    return data;
  },

  async update(id: number, payload: UpdateLinkData) {
    const { data } = await api.put<Link>(`/links/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    await api.delete(`/links/${id}`);
  },
};

export default linkService;
