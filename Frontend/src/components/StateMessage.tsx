import { CircleAlert, Info } from 'lucide-react'

interface StateMessageProps {
  title: string
  detail: string
  action?: { label: string; onClick: () => void }
  kind?: 'empty' | 'error'
}

export function StateMessage({ title, detail, action, kind = 'empty' }: StateMessageProps) {
  return (
    <div className={`state-message state-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="state-mark" aria-hidden="true">{kind === 'error' ? <CircleAlert size={17} /> : <Info size={17} />}</span>
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
        {action && <button className="button button-secondary" type="button" onClick={action.onClick}>{action.label}</button>}
      </div>
    </div>
  )
}

