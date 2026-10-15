import { AlertCircle, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { TaskDetails } from '../components/TaskDetails'
import { useBreadcrumbs } from '../components/BreadcrumbContext'
import archiveService, { ArchivedTaskDetail } from '../services/archiveService'

export function ArchivedTask() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const selectedTaskId = Number(taskId)
  const setBreadcrumbs = useBreadcrumbs()
  const [task, setTask] = useState<ArchivedTaskDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTask = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setBreadcrumbs([])
    try { setTask(await archiveService.getTask(selectedTaskId)) }
    catch { setTask(null); setError('Não foi possível carregar esta tarefa arquivada.') }
    finally { setIsLoading(false) }
  }, [selectedTaskId, setBreadcrumbs])

  useEffect(() => { void loadTask() }, [loadTask])
  useEffect(() => {
    if (!task) return

    const isAreaArchived = Boolean(task.list.area.archivedAt)
    const isListAvailableInArchive = Boolean(task.list.archivedAt) || isAreaArchived
    setBreadcrumbs([
      { label: task.list.area.title, to: isAreaArchived ? `/arquivados/areas/${task.list.area.id}` : undefined },
      { label: task.list.title, to: isListAvailableInArchive ? `/arquivados/listas/${task.list.id}` : undefined },
      { label: task.title },
    ])
  }, [setBreadcrumbs, task])

  if (isLoading) return <div className="lists-state" aria-live="polite"><LoaderCircle className="spin" size={32} /><h2>Carregando tarefa...</h2></div>
  if (error || !task) return <div className="lists-state is-error" role="alert"><AlertCircle size={36} /><h2>Erro ao carregar</h2><p>{error}</p><button className="secondary-action" type="button" onClick={() => void loadTask()}>Tentar novamente</button></div>

  return <TaskDetails task={task} listTitle={task.list.title} archivedMode onClose={() => navigate('/arquivados')} onTaskChange={(updated) => setTask((current) => current ? { ...current, ...updated } : current)} />
}
