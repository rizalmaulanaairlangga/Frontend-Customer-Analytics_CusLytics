export function Skeleton({ className = '', label }: { className?: string; label?: string }) {
  return <span className={`skeleton-block ${className}`.trim()} role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true}/>
}
