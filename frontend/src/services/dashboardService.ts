import api from "./api";

export type DashboardTask = {
  id: number;
  title: string;
  dueDate: string | null;
  listId: number;
  areaId: number;
  listTitle: string;
  listColor: string | null;
  checklistCompleted: number;
  checklistTotal: number;
  linksTotal: number;
};

export type DashboardSummary = {
  attention: {
    overdue: number;
    today: number;
    week: number;
    earliestOverdue: string | null;
  };
  inProgress: DashboardTask[];
  upcoming: DashboardTask[];
  overview: { total: number; pending: number; completed: number; completionPercentage: number };
  areas: {
    id: number;
    title: string;
    color: string | null;
    listsTotal: number;
    tasksTotal: number;
  }[];
  firstAreaId: number | null;
  firstList: { id: number; areaId: number } | null;
};

const dashboardService = {
  async getSummary(today: string) {
    const { data } = await api.get<DashboardSummary>("/dashboard", { params: { today } });
    return data;
  },
};

export default dashboardService;
