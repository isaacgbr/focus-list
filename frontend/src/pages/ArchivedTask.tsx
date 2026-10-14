import { AlertCircle, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { TaskDetails } from '../components/TaskDetails'
import archiveService, { ArchivedTaskDetail } from '../services/archiveService'

export function ArchivedTask() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const selectedTaskId = Number(taskId)
  const [task, setTask] = useState<ArchivedTaskDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTask = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try { setTask(await archiveService.getTask(selectedTaskId)) }
    catch { setTask(null); setError('Não foi possível carregar esta tarefa arquivada.') }
    finally { setIsLoading(false) }
  }, [selectedTaskId])

  useEffect(() => { void loadTask() }, [loadTask])

  if (isLoading) return <div className="lists-state" aria-live="polite"><LoaderCircle className="spin" size={32} /><h2>Carregando tarefa...</h2></div>
  if (error || !task) return <div className="lists-state is-error" role="alert"><AlertCircle size={36} /><h2>Erro ao carregar</h2><p>{error}</p><button className="secondary-action" type="button" onClick={() => void loadTask()}>Tentar novamente</button></div>

  return <TaskDetails task={task} listTitle={task.list.title} archivedMode onClose={() => navigate('/arquivados')} onTaskChange={(updated) => setTask((current) => current ? { ...current, ...updated } : current)} />
}
