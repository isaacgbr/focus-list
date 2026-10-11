import { Check } from 'lucide-react'

export function Brand() {
  return (
    <div className="brand" aria-label="FocusList">
      <span className="brand-mark" aria-hidden="true">
        <Check size={24} strokeWidth={3} />
      </span>
      <span>FocusList</span>
    </div>
  )
}
