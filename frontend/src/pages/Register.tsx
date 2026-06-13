import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message, Radio } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import axios from 'axios'

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<'personal' | 'enterprise'>('personal')
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const response = await axios.post('/api/auth/register', {
        ...values,
        userType
      })
      const code = response.data?.code
      const messageText = response.data?.message

      if (code === 200) {
        message.success('注册成功！请登录')
        navigate('/login')
      } else {
        throw new Error(messageText || '注册失败')
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || '注册失败，请稍后重试'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '8px' }}>创建账户</h1>
        <p style={{ color: '#666' }}>加入我们的车辆出租平台</p>
      </div>

      <Radio.Group
        value={userType}
        onChange={(e) => setUserType(e.target.value)}
        style={{ marginBottom: '24px', width: '100%' }}
      >
        <Radio.Button value="personal" style={{ width: '50%', textAlign: 'center' }}>
          个人用户
        </Radio.Button>
        <Radio.Button value="enterprise" style={{ width: '50%', textAlign: 'center' }}>
          企业用户
        </Radio.Button>
      </Radio.Group>

      <Form
        name="register"
        onFinish={onFinish}
        size="large"
        layout="vertical"
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="邮箱"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="手机号"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="确认密码"
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
            注册
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        已有账户？<Link to="/login" style={{ color: '#667eea' }}>立即登录</Link>
      </div>
    </div>
  )
}

export default Register
