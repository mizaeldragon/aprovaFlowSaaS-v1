import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import MainLayout from '../components/layout/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import ProFeatureRoute from '../components/ProFeatureRoute'

const Landing = lazy(() => import('../pages/Landing'))
const AuthPage = lazy(() => import('../pages/AuthPage'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const PublicReview = lazy(() => import('../pages/PublicReview'))
const Terms = lazy(() => import('../pages/Terms'))
const Privacy = lazy(() => import('../pages/Privacy'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const CreatePost = lazy(() => import('../pages/CreatePost'))
const Settings = lazy(() => import('../pages/Settings'))
const Kanban = lazy(() => import('../pages/Kanban'))
const Customers = lazy(() => import('../pages/Customers'))
const CopyAI = lazy(() => import('../pages/CopyAI'))
const Projects = lazy(() => import('../pages/Projects'))
const BillingResult = lazy(() => import('../pages/BillingResult'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #709BFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function AppRouter() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rotas Comerciais e Públicas (Fora do Painel) */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/review/:slug" element={<PublicReview />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route
            path="/billing/success"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BillingResult />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/cancelled"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BillingResult />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Rotas Privadas (Por Trás da Parede de Pagamento/Login) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CreatePost />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanban"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Kanban />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Customers />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/copy-ai"
            element={
              <ProFeatureRoute>
                <MainLayout>
                  <CopyAI />
                </MainLayout>
              </ProFeatureRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Projects />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default AppRouter
