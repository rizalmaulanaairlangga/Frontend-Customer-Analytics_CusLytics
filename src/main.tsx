import { StrictMode } from 'react'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './styles/global.css'
import './styles/layout.css'
import './styles/dashboard.css'
import './styles/data-quality.css'
import './styles/sales-products.css'
import './styles/customer-analytics.css'
import './styles/ml-studio.css'
import './styles/model-evaluation.css'
import './styles/action-center.css'
import './styles/reports.css'
import './styles/components.css'
import './styles/select.css'
import './styles/datepicker.css'
import './styles/bar-fill.css'
import './styles/modal.css'
import './styles/page-skeleton.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </StrictMode>,
)
