import { AppRoutes } from './routes'
import { ThemeProvider } from '../contexts/ThemeContext'

export function App() {
  return <ThemeProvider><AppRoutes /></ThemeProvider>
}
