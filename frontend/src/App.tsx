import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PredictPage from './pages/PredictPage';
import SkillGapPage from './pages/SkillGapPage';
import MarketPage from './pages/MarketPage';
import ResumePage from './pages/ResumePage';
import AssessmentPage from './pages/AssessmentPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard"  element={<Dashboard />} />
                  <Route path="/predict"    element={<PredictPage />} />
                  <Route path="/skills"     element={<SkillGapPage />} />
                  <Route path="/market"     element={<MarketPage />} />
                  <Route path="/resume"     element={<ResumePage />} />
                  <Route path="/assessment" element={<AssessmentPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
