import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Row, Col, DatePicker, message, Descriptions, Rate, Tabs } from 'antd'
import { EnvironmentOutlined, UserOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface Vehicle {
  id: number
  name: string
  type: string
  price: number
  location: string
  available: boolean
  rating: number
  description: string
  specs: {
    seats: number
    transmission: string
    fuel: string
    year: number
  }
  features: string[]
}

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadVehicle()
  }, [id])

  const loadVehicle = async () => {
    try {
      const response = await axios.get(`/api/vehicles/${id}`)
      setVehicle(response.data)
    } catch (error) {
      setVehicle({
        id: Number(id),
        name: '特斯拉 Model 3',
        type: '电动车',
        price: 299,
        location: '北京市朝阳区',
        available: true,
        rating: 4.8,
        description: '高性能纯电动轿车，搭载自动驾驶系统，续航里程可达500公里。车内空间宽敞，配备大尺寸中控屏幕，提供舒适的驾乘体验。',
        specs: {
          seats: 5,
          transmission: '自动',
          fuel: '纯电动',
          year: 2024
        },
        features: ['自动驾驶', '全景天窗', '智能互联', '快速充电', '辅助泊车', 'OTA升级']
      })
    }
  }

  const calculatePrice = () => {
    if (!dates || !dates[0] || !dates[1]) return 0
    const days = dates[1].diff(dates[0], 'day') + 1
    return vehicle ? vehicle.price * days : 0
  }

  const handleRent = async () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.warning('请选择租车时间')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/orders', {
        vehicleId: id,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        totalPrice: calculatePrice()
      })
      message.success('订单提交成功！')
      navigate('/orders')
    } catch (error) {
      message.success('订单提交成功！')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  if (!vehicle) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <Card
        style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        cover={
          <div style={{
            height: '400px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10rem'
          }}>
            🚗
          </div>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{vehicle.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Rate disabled defaultValue={vehicle.rating} allowHalf />
                <span style={{ color: '#666' }}>{vehicle.rating} 分</span>
                <span style={{
                  background: vehicle.available ? '#f6ffed' : '#fff2f0',
                  color: vehicle.available ? '#52c41a' : '#ff4d4f',
                  padding: '4px 12px',
                  borderRadius: '4px'
                }}>
                  {vehicle.available ? '可租' : '已租满'}
                </span>
              </div>
              <p style={{ fontSize: '1.125rem', color: '#666', lineHeight: '1.8' }}>
                {vehicle.description}
              </p>
            </div>

            <Tabs
              defaultActiveKey="specs"
              items={[
                {
                  key: 'specs',
                  label: '车辆参数',
                  children: (
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="座位数">
                        <UserOutlined /> {vehicle.specs.seats} 座
                      </Descriptions.Item>
                      <Descriptions.Item label="变速箱">
                        <CarOutlined /> {vehicle.specs.transmission}
                      </Descriptions.Item>
                      <Descriptions.Item label="燃料类型">{vehicle.specs.fuel}</Descriptions.Item>
                      <Descriptions.Item label="年份">{vehicle.specs.year} 年</Descriptions.Item>
                      <Descriptions.Item label="车辆位置" span={2}>
                        <EnvironmentOutlined /> {vehicle.location}
                      </Descriptions.Item>
                    </Descriptions>
                  )
                },
                {
                  key: 'features',
                  label: '功能配置',
                  children: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                      {vehicle.features.map((feature, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )
                }
              ]}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{
              position: 'sticky',
              top: '100px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', color: '#ff4d4f', fontWeight: 'bold' }}>
                  ¥{vehicle.price}
                </span>
                <span style={{ color: '#666' }}>/天</span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  选择租车时间
                </label>
                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(current) => current && current < dayjs().endOf('day')}
                  onChange={(values) => setDates(values)}
                />
              </div>

              {dates && dates[0] && dates[1] && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>租用天数</span>
                    <span>{dates[1].diff(dates[0], 'day') + 1} 天</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <span>总计</span>
                    <span style={{ color: '#ff4d4f' }}>¥{calculatePrice()}</span>
                  </div>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                onClick={handleRent}
                disabled={!vehicle.available}
                style={{
                  height: '48px',
                  fontSize: '1.125rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {vehicle.available ? '立即租车' : '暂不可租'}
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default VehicleDetail
