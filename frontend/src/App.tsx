import { Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import Terms from '@/pages/Terms'
import Success from '@/pages/Success'
import Form from '@/pages/Form'
import NotFound from '@/pages/NotFound'
import Layout from '@/components/Layout'
import AdminLayout from '@/components/admin/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import Registrations from '@/pages/admin/Registrations'
import Tickets from '@/pages/admin/Tickets'
import Invites from '@/pages/admin/Invites'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* Locale-prefixed public routes */}
        <Route path=":locale">
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="terms" element={<Terms />} />
          <Route path="success" element={<Success />} />
          <Route path="form" element={<Form />} />
        </Route>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/success" element={<Success />} />
        <Route path="/form" element={<Form />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="invites" element={<Invites />} />
          <Route path="forms" element={<div style={{padding:'1rem'}}>表單管理（稍後提供）</div>} />
          <Route path="intro" element={<div style={{padding:'1rem'}}>編輯說明（稍後提供）</div>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
