import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd'
import {
  CarOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons'

const { Header, Content, Footer } = AntLayout

interface LayoutProps {
  children: React.ReactNode
  isAuthenticated: boolean
  onLogout: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, isAuthenticated, onLogout }) => {
  const navigate = useNavigate()

  const items = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/vehicles', icon: <CarOutlined />, label: <Link to="/vehicles">车辆列表</Link> },
    { key: '/map', icon: <EnvironmentOutlined />, label: <Link to="/map">地图视图</Link> },
  ]

  const userMenuItems = [
    { key: 'orders', icon: <ShoppingCartOutlined />, label: <Link to="/orders">我的订单</Link> },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true }
  ]

  const handleUserMenuClick = (e: { key: string }) => {
    if (e.key === 'logout') {
      onLogout()
      navigate('/')
    }
  }

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderRadius: '0 0 16px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
          <CarOutlined style={{ fontSize: '2rem', color: '#667eea', marginRight: '8px' }} />
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
            车辆出租平台
          </span>
        </div>
        <Menu
          mode="horizontal"
          defaultSelectedKeys={['/']}
          items={items}
          style={{
            minWidth: '400px',
            border: 'none',
            background: 'transparent'
          }}
        />
        <div style={{ marginLeft: 'auto' }}>
          {isAuthenticated ? (
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <Avatar
                style={{ cursor: 'pointer', background: '#667eea' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          ) : (
            <>
              <Link to="/login">
                <Button type="text" style={{ marginRight: '8px' }}>登录</Button>
              </Link>
              <Link to="/register">
                <Button type="primary" style={{ background: '#667eea', borderColor: '#667eea' }}>
                  注册
                </Button>
              </Link>
            </>
          )}
        </div>
      </Header>
      <Content style={{ padding: '20px', background: 'transparent' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </Content>
      <Footer style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        marginTop: '40px',
        borderRadius: '16px 16px 0 0'
      }}>
        车辆出租平台 ©2026 - 多种车辆任您选择
      </Footer>
    </AntLayout>
  )
}

export default Layout
