import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message, Radio, Alert, Divider, Tag, Space } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  CarOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  SolutionOutlined
} from '@ant-design/icons'
import axios from 'axios'

type UserType = 'personal' | 'enterprise'

interface FieldErr {
  field: string
  message: string
}

interface RegisterRes {
  code: number
  message: string
  success?: boolean
  data?: {
    id: number
    username: string
    email: string
    phone: string
    userType: string
  }
  fieldErrors?: FieldErr[]
  profile?: {
    userType: string
    complete: boolean
    requiredFields: string[]
    missingFields: string[]
    nextStepHint: string
  }
}

const idCardPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
const licensePattern = /^[A-Za-z0-9]{8,20}$/
const creditCodePattern = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
const phonePattern = /^1[3-9]\d{9}$/
const usernamePattern = /^[A-Za-z0-9_\u4e00-\u9fa5]{3,20}$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_.-]{6,32}$/

const validateIdCardChecksum = (id: string): boolean => {
  if (!id || id.length !== 18) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const c = id.charCodeAt(i)
    if (c < 48 || c > 57) return false
    sum += (c - 48) * weights[i]
  }
  return codes[sum % 11] === id.charAt(17).toUpperCase()
}

const FIELD_LABELS: Record<string, string> = {
  username: '用户名',
  password: '密码',
  confirmPassword: '确认密码',
  email: '邮箱',
  phone: '手机号',
  userType: '账户类型',
  idCard: '身份证号',
  licenseNumber: '驾驶证号',
  companyName: '公司全称',
  creditCode: '统一社会信用代码',
  legalPersonName: '法人代表姓名',
  legalPersonIdCard: '法人代表身份证号'
}

const sanitizeErrorProfileHint = (
  raw: string | null | undefined,
  userType: UserType,
  errorCount: number
): string | null => {
  if (errorCount <= 0) return raw ?? null
  const misleadingKeywords = ['资料完整', '可直接', '可前往', '可浏览', '下单', '申请']
  const hasMisleading = misleadingKeywords.some(k => (raw || '').includes(k))
  if (!raw || hasMisleading) {
    const prefix = userType === 'enterprise' ? '企业资质' : '实名信息'
    return `${prefix}存在 ${errorCount} 项问题，请修正页面中标红的字段后重新提交`
  }
  return raw
}

const Register: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<UserType>('personal')
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [profileHint, setProfileHint] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const navigate = useNavigate()

  const personalRequiredFields = useMemo(
    () => ['username', 'password', 'email', 'phone', 'idCard', 'licenseNumber'],
    []
  )
  const enterpriseRequiredFields = useMemo(
    () => ['username', 'password', 'email', 'phone', 'companyName', 'creditCode', 'legalPersonName', 'legalPersonIdCard'],
    []
  )

  useEffect(() => {
    setServerErrors({})
    setProfileHint(null)
    setSubmitStatus('idle')
    form.setFields([
      { name: 'idCard', errors: [] },
      { name: 'licenseNumber', errors: [] },
      { name: 'companyName', errors: [] },
      { name: 'creditCode', errors: [] },
      { name: 'legalPersonName', errors: [] },
      { name: 'legalPersonIdCard', errors: [] }
    ])
  }, [userType, form])

  const applyServerErrors = (errors?: FieldErr[]) => {
    if (!errors || errors.length === 0) {
      setServerErrors({})
      return
    }
    const map: Record<string, string> = {}
    const fields: { name: string; errors: string[] }[] = []
    errors.forEach(e => {
      map[e.field] = e.message
      fields.push({ name: e.field, errors: [e.message] })
    })
    setServerErrors(map)
    form.setFields(fields)
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    setServerErrors({})
    setSubmitStatus('idle')
    try {
      const payload = {
        ...values,
        userType
      }
      const response = await axios.post<RegisterRes>('/api/auth/register', payload, {
        validateStatus: status => status >= 200 && status < 500
      })
      const data = response.data
      if (data && data.success) {
        applyServerErrors([])
        setProfileHint(data.profile?.nextStepHint || null)
        setSubmitStatus('success')
        const typeLabel = userType === 'enterprise' ? '企业账户' : '个人账户'
        message.success({
          content: `${typeLabel}${data.message || '注册成功'}，请登录`,
          duration: 3.5
        })
        setTimeout(() => navigate('/login'), 900)
      } else {
        const errors = data?.fieldErrors
        applyServerErrors(errors)
        setSubmitStatus('error')
        setProfileHint(sanitizeErrorProfileHint(
          data?.profile?.nextStepHint,
          userType,
          errors?.length || 0
        ))
        const first = errors?.[0]
        if (first) {
          message.warning(`${FIELD_LABELS[first.field] || first.field}：${first.message}`)
        } else {
          message.error(data?.message || '注册失败，请检查填写内容')
        }
      }
    } catch (error: any) {
      const respData = error?.response?.data as RegisterRes | undefined
      const errors = respData?.fieldErrors
      applyServerErrors(errors)
      setSubmitStatus('error')
      setProfileHint(sanitizeErrorProfileHint(
        respData?.profile?.nextStepHint,
        userType,
        errors?.length || 0
      ))
      const msg = respData?.message || error.message || '注册失败，请稍后重试'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const currentRequired =
    userType === 'enterprise' ? enterpriseRequiredFields : personalRequiredFields

  return (
    <div className="auth-container" style={{ paddingBottom: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: 8 }}>创建账户</h1>
        <p style={{ color: '#666', margin: 0 }}>加入我们的车辆出租平台</p>
      </div>

      <Radio.Group
        value={userType}
        onChange={e => setUserType(e.target.value)}
        style={{ marginBottom: 16, width: '100%' }}
        size="large"
      >
        <Radio.Button value="personal" style={{ width: '50%', textAlign: 'center' }}>
          <UserOutlined /> 个人用户
        </Radio.Button>
        <Radio.Button value="enterprise" style={{ width: '50%', textAlign: 'center' }}>
          <BankOutlined /> 企业用户
        </Radio.Button>
      </Radio.Group>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          userType === 'personal'
            ? '个人租车需实名登记：提供身份证与驾驶证信息后方可下单'
            : '企业租车需资质审核：完整填写公司信息，开通后可申请批量用车'
        }
      />

      {profileHint && (
        <Alert
          type={submitStatus === 'error' || Object.keys(serverErrors).length > 0 ? 'warning' : submitStatus === 'success' ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
          message={profileHint}
        />
      )}

      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        size="large"
        layout="vertical"
        initialValues={{ userType: 'personal' }}
        scrollToFirstError
      >
        <Form.Item
          name="username"
          label={
            <Space>
              <span>用户名</span>
              <Tag color="blue" style={{ marginLeft: 0 }}>
                {currentRequired.includes('username') ? '必填' : '选填'}
              </Tag>
            </Space>
          }
          rules={[
            { required: currentRequired.includes('username'), message: '请输入用户名' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                if (!usernamePattern.test(value)) {
                  return Promise.reject(new Error('3-20 位字母、数字、下划线或中文'))
                }
                if (serverErrors.username) {
                  return Promise.reject(new Error(serverErrors.username))
                }
                return Promise.resolve()
              }
            }
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="3-20 位字母、数字、下划线或中文" allowClear />
        </Form.Item>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="email"
            label={
              <Space>
                <span>邮箱</span>
                <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
              </Space>
            }
            style={{ flex: 1 }}
            rules={[
              { required: currentRequired.includes('email'), message: '请输入邮箱' },
              { type: 'email', message: '请输入有效邮箱，如 name@example.com' },
              {
                validator: (_rule, _value) => {
                  if (serverErrors.email) {
                    return Promise.reject(new Error(serverErrors.email))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="name@example.com" allowClear />
          </Form.Item>

          <Form.Item
            name="phone"
            label={
              <Space>
                <span>手机号</span>
                <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
              </Space>
            }
            style={{ flex: 1 }}
            rules={[
              { required: currentRequired.includes('phone'), message: '请输入手机号' },
              { pattern: phonePattern, message: '请输入 11 位中国大陆手机号' },
              {
                validator: (_rule, _value) => {
                  if (serverErrors.phone) {
                    return Promise.reject(new Error(serverErrors.phone))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="13800138000" allowClear maxLength={11} />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Form.Item
            name="password"
            label={
              <Space>
                <span>密码</span>
                <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
              </Space>
            }
            style={{ flex: 1 }}
            rules={[
              { required: currentRequired.includes('password'), message: '请输入密码' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  if (!passwordPattern.test(value)) {
                    return Promise.reject(new Error('6-32 位且必须包含字母和数字'))
                  }
                  if (serverErrors.password) {
                    return Promise.reject(new Error(serverErrors.password))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="至少含字母与数字" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            label={
              <Space>
                <span>确认密码</span>
                <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
              </Space>
            }
            style={{ flex: 1 }}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (serverErrors.confirmPassword) {
                    return Promise.reject(new Error(serverErrors.confirmPassword))
                  }
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" />
          </Form.Item>
        </div>

        {userType === 'personal' && (
          <>
            <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>
              <SolutionOutlined /> 实名信息（用于驾驶人核验）
            </Divider>

            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item
                name="idCard"
                label={
                  <Space>
                    <span>身份证号</span>
                    <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
                  </Space>
                }
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: '请输入身份证号' },
                  {
                    validator: (_rule, value) => {
                      if (!value) return Promise.resolve()
                      if (!idCardPattern.test(value)) {
                        return Promise.reject(new Error('请输入 18 位有效身份证号'))
                      }
                      if (!validateIdCardChecksum(value)) {
                        return Promise.reject(new Error('身份证号校验位不正确'))
                      }
                      if (serverErrors.idCard) {
                        return Promise.reject(new Error(serverErrors.idCard))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="18 位身份证号"
                  maxLength={18}
                  allowClear
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>

              <Form.Item
                name="licenseNumber"
                label={
                  <Space>
                    <span>驾驶证号</span>
                    <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
                  </Space>
                }
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: '请输入机动车驾驶证号' },
                  { pattern: licensePattern, message: '8-20 位字母或数字' },
                  {
                    validator: (_rule, _value) => {
                      if (serverErrors.licenseNumber) {
                        return Promise.reject(new Error(serverErrors.licenseNumber))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input
                  prefix={<CarOutlined />}
                  placeholder="8-20 位字母或数字"
                  maxLength={20}
                  allowClear
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </div>

            <Alert
              type={submitStatus === 'error' ? 'warning' : 'info'}
              showIcon
              style={{ marginTop: -4 }}
              message={
                submitStatus === 'error'
                  ? '当前提交存在校验错误，请修正上方标红字段后重新提交，实名资料通过后即可租车。'
                  : '资料完整度：驾驶证 + 身份证齐备后，即可直接在平台下单租车。'
              }
            />
          </>
        )}

        {userType === 'enterprise' && (
          <>
            <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>
              <SafetyCertificateOutlined /> 企业资质信息
            </Divider>

            <Form.Item
              name="companyName"
              label={
                <Space>
                  <span>公司全称</span>
                  <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
                </Space>
              }
              rules={[
                { required: true, message: '请填写公司全称' },
                { min: 4, message: '公司名称至少 4 个字符' },
                {
                  validator: (_rule, _value) => {
                    if (serverErrors.companyName) {
                      return Promise.reject(new Error(serverErrors.companyName))
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input prefix={<BankOutlined />} placeholder="与营业执照一致的公司全称" allowClear />
            </Form.Item>

            <Form.Item
              name="creditCode"
              label={
                <Space>
                  <span>统一社会信用代码</span>
                  <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
                </Space>
              }
              rules={[
                { required: true, message: '请输入统一社会信用代码' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve()
                    if (!creditCodePattern.test(value.toUpperCase())) {
                      return Promise.reject(new Error('应为 18 位字母与数字组合（营业执照上的代码）'))
                    }
                    if (serverErrors.creditCode) {
                      return Promise.reject(new Error(serverErrors.creditCode))
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input
                prefix={<SafetyCertificateOutlined />}
                placeholder="18 位统一社会信用代码"
                maxLength={18}
                allowClear
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item
                name="legalPersonName"
                label={
                  <Space>
                    <span>法人代表姓名</span>
                    <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
                  </Space>
                }
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: '请填写法人代表姓名' },
                  { min: 2, message: '至少 2 个字符' },
                  {
                    validator: (_rule, _value) => {
                      if (serverErrors.legalPersonName) {
                        return Promise.reject(new Error(serverErrors.legalPersonName))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input prefix={<TeamOutlined />} placeholder="法人代表姓名" allowClear />
              </Form.Item>

              <Form.Item
                name="legalPersonIdCard"
                label={
                  <Space>
                    <span>法人身份证号</span>
                    <Tag color="blue" style={{ marginLeft: 0 }}>必填</Tag>
                  </Space>
                }
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: '请填写法人代表身份证号' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      if (!idCardPattern.test(value)) {
                        return Promise.reject(new Error('请输入 18 位有效身份证号'))
                      }
                      if (!validateIdCardChecksum(value)) {
                        return Promise.reject(new Error('身份证号校验位不正确'))
                      }
                      if (serverErrors.legalPersonIdCard) {
                        return Promise.reject(new Error(serverErrors.legalPersonIdCard))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="18 位身份证号"
                  maxLength={18}
                  allowClear
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </div>

            <Alert
              type={submitStatus === 'error' ? 'warning' : 'info'}
              showIcon
              style={{ marginTop: -4 }}
              message={
                submitStatus === 'error'
                  ? '当前提交存在校验错误，请修正上方标红字段后重新提交，企业资质审核通过后即可开通用车通道。'
                  : '企业资质提交后，运营人员会在 1 个工作日内完成审核，审核通过即可开通企业用车通道。'
              }
            />
          </>
        )}

        <Form.Item style={{ marginTop: 20, marginBottom: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 48,
              fontSize: '1rem',
              background:
                userType === 'enterprise'
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            {userType === 'enterprise' ? '提交企业资质并注册' : '提交实名资料并注册'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        已有账户？<Link to="/login" style={{ color: '#667eea' }}>立即登录</Link>
      </div>
    </div>
  )
}

export default Register
