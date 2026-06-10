import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Card,
  message,
  Row,
  Col,
  Divider,
  Alert,
  Result
} from 'antd'
import {
  CarOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ShopOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

interface ApplyFormData {
  plannedDateRange: [Dayjs, Dayjs]
  vehiclePreference: string[]
  estimatedQuantity: number
  contactName: string
  contactPhone: string
  contactEmail: string
  businessPurpose: string
  specialRequirements: string
}

const vehicleTypes = [
  { value: '轿车', label: '轿车' },
  { value: 'SUV', label: 'SUV' },
  { value: '电动车', label: '电动车' },
  { value: '豪华轿车', label: '豪华轿车' },
  { value: 'MPV', label: 'MPV' },
  { value: '跑车', label: '跑车' }
]

const EnterpriseRentalApply: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<ApplyFormData>()
  const [loading, setLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState<number | null>(null)

  const onFinish = async (values: ApplyFormData) => {
    setLoading(true)
    try {
      const [startDate, endDate] = values.plannedDateRange

      const response = await axios.post('/api/enterprise-rental/apply', {
        plannedStartDate: startDate.format('YYYY-MM-DD'),
        plannedEndDate: endDate.format('YYYY-MM-DD'),
        vehiclePreference: values.vehiclePreference?.join(','),
        estimatedQuantity: values.estimatedQuantity,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        contactEmail: values.contactEmail,
        businessPurpose: values.businessPurpose,
        specialRequirements: values.specialRequirements
      })

      if (response.data?.code === 200) {
        setApplicationId(response.data.data.id)
        setSubmitSuccess(true)
        message.success('申请提交成功！')
      } else if (response.data?.code === 403) {
        message.error('仅企业用户可提交长租申请')
      } else {
        message.error(response.data?.message || '提交失败，请稍后重试')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录')
        navigate('/login')
      } else {
        message.error(error.response?.data?.message || '提交失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewApplications = () => {
    navigate('/orders', { state: { activeKey: 'enterprise' } })
  }

  if (submitSuccess) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Result
            status="success"
            title="企业长租申请提交成功！"
            subTitle={`申请编号：#${applicationId?.toString().padStart(6, '0')}，我们将在1-3个工作日内完成审核，专属客户经理将与您联系。`}
            extra={[
              <Button type="primary" key="view" onClick={handleViewApplications}>
                查看申请状态
              </Button>,
              <Button key="continue" onClick={() => navigate('/')}>
                返回首页
              </Button>
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShopOutlined style={{ color: '#667eea', fontSize: '1.5rem' }} />
            <span>企业长租申请</span>
          </div>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        bodyStyle={{ padding: '32px' }}
      >
        <Alert
          message="企业长租专属服务"
          description="为企业客户提供1个月以上的长期用车解决方案，包括专属客户经理、定制化车辆配置、灵活的结算方式等增值服务。"
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: '24px', borderRadius: '8px' }}
        />

        <Form
          form={form}
          name="enterprise-rental-apply"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Divider orientation="left">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarOutlined style={{ color: '#667eea' }} />
              用车计划
            </span>
          </Divider>

          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item
                name="plannedDateRange"
                label="计划用车时间"
                rules={[
                  { required: true, message: '请选择计划用车时间' },
                  () => ({
                    validator(_, value) {
                      if (!value || value.length < 2) {
                        return Promise.resolve()
                      }
                      const [start, end] = value
                      const diffDays = end.diff(start, 'day')
                      if (diffDays < 30) {
                        return Promise.reject(new Error('企业长租需至少30天'))
                      }
                      return Promise.resolve()
                    },
                  }),
                ]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  minDate={dayjs()}
                  format="YYYY-MM-DD"
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="estimatedQuantity"
                label="预计用车数量"
                rules={[
                  { required: true, message: '请输入预计用车数量' },
                  { type: 'number', min: 1, message: '至少需要1辆车' }
                ]}
                initialValue={1}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  addonAfter="辆"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="vehiclePreference"
            label="车型偏好（可多选）"
            rules={[{ required: true, message: '请选择车型偏好' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择所需车型"
              style={{ width: '100%' }}
              optionFilterProp="label"
            >
              {vehicleTypes.map(type => (
                <Option key={type.value} value={type.value} label={type.label}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserOutlined style={{ color: '#667eea' }} />
              联系人信息
            </span>
          </Divider>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="contactName"
                label="联系人姓名"
                rules={[
                  { required: true, message: '请输入联系人姓名' },
                  { min: 2, message: '姓名至少2个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#667eea' }} />}
                  placeholder="请输入联系人姓名"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#667eea' }} />}
                  placeholder="请输入手机号"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="contactEmail"
                label="联系邮箱"
                rules={[
                  { required: true, message: '请输入联系邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#667eea' }} />}
                  placeholder="请输入邮箱地址"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileTextOutlined style={{ color: '#667eea' }} />
              详细需求
            </span>
          </Divider>

          <Form.Item
            name="businessPurpose"
            label="企业用途说明"
            rules={[
              { required: true, message: '请简述企业用车用途' },
              { min: 10, message: '请详细描述用途（至少10字）' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="例如：公司日常通勤、商务接待、项目团队外出考察等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="specialRequirements"
            label="特殊要求（选填）"
          >
            <TextArea
              rows={3}
              placeholder="例如：需配备车载WiFi、蓝牙免提系统、司机服务、指定颜色等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Button
                size="large"
                onClick={() => navigate('/')}
                style={{ width: '160px' }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{
                  width: '200px',
                  height: '48px',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                <CarOutlined /> 提交申请
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Card
        style={{
          marginTop: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <EnvironmentOutlined style={{ color: '#667eea', fontSize: '1.25rem' }} />
          <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#333' }}>
            企业长租专属优势
          </span>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💰</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>优惠价格</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>长租期享专属折扣，最高8折</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👨‍💼</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>专属服务</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>一对一客户经理全程服务</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📋</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>灵活结算</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>支持企业月结、开票等服务</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🚗</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>定制配置</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>可根据企业需求定制车辆</div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default EnterpriseRentalApply
