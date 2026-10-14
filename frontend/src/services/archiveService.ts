import api from './api'

export type ArchivedItemType = 'area' | 'list' | 'task'

export type ArchivedItem = {
  id: number
  type: ArchivedItemType
  title: string
  description: string | null
  archivedAt: string
  context: string | null
  canRestore: boolean
  listCount?: number
  taskCount?: number
  areaTitle?: string
  listTitle?: string
}

export type ArchivedTaskSummary = {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | null
  completed: boolean
  archivedAt: string | null
}

export type ArchivedListDetail = {
  id: number
  title: string
  description: string | null
  archivedAt: string
  area: { id: number; title: string; archivedAt: string | null }
  tasks: ArchivedTaskSummary[]
}

export type ArchivedTaskDetail = ArchivedTaskSummary & {
  completedAt: string | null
  listId: number
  createdAt: string
  updatedAt: string
  list: {
    id: number
    title: string
    archivedAt: string | null
    area: { id: number; title: string; archivedAt: string | null }
  }
  checklist: Array<{ id: number; title: string; completed: boolean; taskId: number; createdAt: string }>
  links: Array<{ id: number; title: string; url: string; taskId: number; createdAt: string }>
}

export type ArchivedAreaDetail = {
  id: number
  title: string
  description: string | null
  color: string | null
  icon: string | null
  archivedAt: string
  lists: Array<{
    id: number
    title: string
    description: string | null
    archivedAt: string | null
    tasks: ArchivedTaskSummary[]
  }>
}

const archiveService = {
  async getAll() {
    const { data } = await api.get<ArchivedItem[]>('/archived')
    return data
  },

  async getArea(id: number) {
    const { data } = await api.get<ArchivedAreaDetail>(`/archived/areas/${id}`)
    return data
  },

  async getList(id: number) {
    const { data } = await api.get<ArchivedListDetail>(`/archived/lists/${id}`)
    return data
  },

  async getTask(id: number) {
    const { data } = await api.get<ArchivedTaskDetail>(`/archived/tasks/${id}`)
    return data
  },
}

export default archiveService
