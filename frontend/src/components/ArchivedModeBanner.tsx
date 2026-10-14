import { Archive } from 'lucide-react'

export function ArchivedModeBanner() {
  return (
    <aside className="archived-mode-banner" aria-label="Item arquivado">
      <span className="archived-mode-icon" aria-hidden="true"><Archive size={20} /></span>
      <div><strong>Arquivado</strong><span>Este item não aparece na organização principal.</span></div>
    </aside>
  )
}
