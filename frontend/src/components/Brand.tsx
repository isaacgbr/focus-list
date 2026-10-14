type BrandProps = {
  markSrc?: string
}

export function Brand({ markSrc = '/focuslist-mark.png' }: BrandProps) {
  return (
    <div className="brand" aria-label="FocusList">
      <img className="brand-mark" src={markSrc} alt="" aria-hidden="true" />
      <span>Focus<span className="brand-name-accent">List</span></span>
    </div>
  )
}
