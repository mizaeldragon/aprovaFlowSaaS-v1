import { Route, Routes } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import CreatePost from '../pages/CreatePost'
import Dashboard from '../pages/Dashboard'
import PublicReview from '../pages/PublicReview'

function AppRouter() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<CreatePost />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/review/:slug" element={<PublicReview />} />
      </Routes>
    </MainLayout>
  )
}

export default AppRouter
