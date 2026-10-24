import { Link } from 'react-router-dom'

export function ModulePlaceholderPage({ title }: { title: string }) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">CusLytics workspace</p>
      <h1>{title}</h1>
      <p>This module is not implemented yet.</p>
      <div className="placeholder-detail"><span className="placeholder-mark" aria-hidden="true">···</span><div><strong>Navigation is ready</strong><p>This area will be implemented in a later phase.</p></div></div>
      <Link className="button button-secondary" to="/">Back to Overview</Link>
    </section>
  )
}
