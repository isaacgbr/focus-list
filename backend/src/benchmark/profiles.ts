export type BenchmarkProfileName = "small" | "medium" | "large";

export type BenchmarkProfile = {
  name: BenchmarkProfileName;
  label: string;
  prefix: string;
  areas: number;
  listsPerArea: number;
  tasksPerList: number;
  checklistPerTask: number;
  linksPerTask: number;
};

export const BENCHMARK_PROFILES: Record<BenchmarkProfileName, BenchmarkProfile> = {
  small: {
    name: "small",
    label: "Pequeno",
    prefix: "[BENCH-SMALL]",
    areas: 5,
    listsPerArea: 5,
    tasksPerList: 10,
    checklistPerTask: 3,
    linksPerTask: 1,
  },
  medium: {
    name: "medium",
    label: "Médio",
    prefix: "[BENCH-MEDIUM]",
    areas: 20,
    listsPerArea: 10,
    tasksPerList: 10,
    checklistPerTask: 4,
    linksPerTask: 1,
  },
  large: {
    name: "large",
    label: "Grande",
    prefix: "[BENCH-LARGE]",
    areas: 50,
    listsPerArea: 10,
    tasksPerList: 20,
    checklistPerTask: 5,
    linksPerTask: 1,
  },
};

export function getBenchmarkProfile(value: string | undefined) {
  if (value === "small" || value === "medium" || value === "large") {
    return BENCHMARK_PROFILES[value];
  }

  throw new Error("Perfil obrigatório: small, medium ou large.");
}

export function expectedCounts(profile: BenchmarkProfile) {
  const lists = profile.areas * profile.listsPerArea;
  const tasks = lists * profile.tasksPerList;

  return {
    areas: profile.areas,
    lists,
    tasks,
    checklistItems: tasks * profile.checklistPerTask,
    links: tasks * profile.linksPerTask,
  };
}
