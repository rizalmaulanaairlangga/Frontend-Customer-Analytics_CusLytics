import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State { return { failed: true } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Frontend runtime error', error, info.componentStack)
  }

  render() {
    if (this.state.failed) return <main className="app-error-fallback" role="alert"><h1>Terjadi kesalahan</h1><p>Aplikasi belum dapat menampilkan halaman ini. Silakan muat ulang.</p><button className="button button-secondary" type="button" onClick={() => window.location.reload()}>Muat Ulang</button></main>
    return this.props.children
  }
}
