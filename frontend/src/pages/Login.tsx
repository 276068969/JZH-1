import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import axios from 'axios'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await axios.post('/api/auth/login', values)
      const code = response.data?.code
      const token = response.data?.token
      const messageText = response.data?.message

      if (code === 200 && token) {
        localStorage.setItem('token', token)
        message.success('登录成功！')
        onLogin()
        navigate('/')
      } else {
        throw new Error(messageText || '登录失败，请检查用户名和密码')
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || '登录失败，请检查用户名和密码'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '8px' }}>欢迎回来</h1>
        <p style={{ color: '#666' }}>登录到您的车辆出租平台账户</p>
      </div>

      <Form
        name="login"
        onFinish={onFinish}
        size="large"
        layout="vertical"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: '48px',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        还没有账户？<Link to="/register" style={{ color: '#667eea' }}>立即注册</Link>
      </div>

      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <strong>测试账号：</strong><br />
        企业用户：admin / admin123<br />
        个人用户：test / test123
      </div>
    </div>
  )
}

export default Login
