import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import axios from 'axios'
import Layout from './components/Layout'
import Home from './pages/Home'
import VehicleList from './pages/VehicleList'
import VehicleDetail from './pages/VehicleDetail'
import VehicleCompare from './pages/VehicleCompare'
import Login from './pages/Login'
import Register from './pages/Register'
import Orders from './pages/Orders'
import MapView from './pages/MapView'
import EnterpriseRentalApply from './pages/EnterpriseRentalApply'

interface UserInfo {
  id: number
  username: string
  email: string
  phone: string
  userType: 'personal' | 'enterprise'
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'))
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)

  const fetchUserInfo = async () => {
    if (!localStorage.getItem('token')) {
      setUserInfo(null)
      return
    }
    setLoadingUser(true)
    try {
      const response = await axios.get('/api/auth/me')
      if (response.data?.code === 200) {
        setUserInfo(response.data.data)
      } else {
        setUserInfo(null)
      }
    } catch (error) {
      setUserInfo(null)
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    return () => {
      axios.interceptors.request.eject(interceptor)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo()
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUserInfo(null)
  }

  const isEnterpriseUser = userInfo?.userType === 'enterprise'

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout
          isAuthenticated={isAuthenticated}
          isEnterpriseUser={isEnterpriseUser}
          onLogout={handleLogout}
        >
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
              element={isAuthenticated ? <Orders isEnterpriseUser={isEnterpriseUser} /> : <Navigate to="/login" />}
            />
            <Route
              path="/enterprise-rental/apply"
              element={isAuthenticated && isEnterpriseUser ? <EnterpriseRentalApply /> : <Navigate to="/login" />}
            />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  )
}

export default App
