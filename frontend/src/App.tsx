import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'
import Home from './pages/Home'
import VehicleList from './pages/VehicleList'
import VehicleDetail from './pages/VehicleDetail'
import VehicleCompare from './pages/VehicleCompare'
import Login from './pages/Login'
import Register from './pages/Register'
import Orders from './pages/Orders'
import MapView from './pages/MapView'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/compare" element={<VehicleCompare />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/orders"
              element={isAuthenticated ? <Orders /> : <Navigate to="/login" />}
            />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  )
}

export default App
