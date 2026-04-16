import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import MainLayout from '../components/layout/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import CreatePost from '../pages/CreatePost'
import Dashboard from '../pages/Dashboard'
import PublicReview from '../pages/PublicReview'
import AuthPage from '../pages/AuthPage'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import Landing from '../pages/Landing'
import Settings from '../pages/Settings'
import Kanban from '../pages/Kanban'
import Customers from '../pages/Customers'
import CopyAI from '../pages/CopyAI'

function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas Comerciais e Públicas (Fora do Painel) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/review/:slug" element={<PublicReview />} />

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
            <ProtectedRoute>
              <MainLayout>
                <CopyAI />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default AppRouter
