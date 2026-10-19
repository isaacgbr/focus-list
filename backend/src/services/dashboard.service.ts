import dashboardRepository from "../repositories/dashboard.repository.js";

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

class DashboardService {
  async getSummary(todayKey: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(todayKey)) {
      throw new Error("A data do Dashboard é inválida.");
    }

    const today = addDays(todayKey, 0);
    if (Number.isNaN(today.getTime()) || today.toISOString().slice(0, 10) !== todayKey) {
      throw new Error("A data do Dashboard é inválida.");
    }

    return dashboardRepository.getSummary(today, addDays(todayKey, 1), addDays(todayKey, 8));
  }
}

export default new DashboardService();
