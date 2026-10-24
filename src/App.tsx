import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Overview from './pages/Overview'
import PovertyExplorer from './pages/PovertyExplorer'
import PredictionStudio from './pages/PredictionStudio'
import ModelComparison from './pages/ModelComparison'
import HistoricalAnalysis from './pages/HistoricalAnalysis'
import DatasetExplorer from './pages/DatasetExplorer'
import Methodology from './pages/Methodology'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/poverty-explorer" element={<PovertyExplorer />} />
          <Route path="/prediction" element={<PredictionStudio />} />
          <Route path="/model-comparison" element={<ModelComparison />} />
          <Route path="/historical-analysis" element={<HistoricalAnalysis />} />
          <Route path="/dataset" element={<DatasetExplorer />} />
          <Route path="/methodology" element={<Methodology />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
