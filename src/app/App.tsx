import { AppRoutes } from './routes'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AppErrorBoundary } from '../components/AppErrorBoundary'

export function App() {
  return <AppErrorBoundary><ThemeProvider><AppRoutes /></ThemeProvider></AppErrorBoundary>
}
