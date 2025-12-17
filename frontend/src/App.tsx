import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Oguz from './pages/mandanten/oguz/Oguz'
import Oflaz from './pages/mandanten/oflaz/Oflaz'
import Klees from './pages/mandanten/klees/Klees'
import RequireAuth from './components/RequireAuth'
import Welcome from './pages/Welcome'
import SelectTenant from './pages/admin/SelectTenant'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/select"
          element={
            <RequireAuth>
              <SelectTenant />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/welcome"
          element={
            <RequireAuth>
              <Welcome />
            </RequireAuth>
          }
        />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/oguz"
          element={
            <RequireAuth>
              <Oguz />
            </RequireAuth>
          }
        />
        <Route
          path="/oflaz"
          element={
            <RequireAuth>
              <Oflaz />
            </RequireAuth>
          }
        />
        <Route
          path="/klees"
          element={
            <RequireAuth>
              <Klees />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
