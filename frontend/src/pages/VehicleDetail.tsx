import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Row, Col, DatePicker, message, Descriptions, Rate, Tabs, Tag, Alert, Spin } from 'antd'
import { EnvironmentOutlined, UserOutlined, CarOutlined, CheckCircleOutlined, SwapOutlined, LoginOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface VehicleSpecs {
  seats: number
  transmission: string
  fuel: string
  year: number
}

interface Vehicle {
  id: number
  name: string
  type: string
  price: number
  location: string
  available: boolean
  rating: number
  description: string
  specs: VehicleSpecs
  features: string[]
}

interface RecommendItem {
  vehicle: Vehicle
  score: number
  reason: string
}

const parseSpecs = (specs: string | VehicleSpecs): VehicleSpecs => {
  if (typeof specs !== 'string') return specs
  const result: VehicleSpecs = { seats: 0, transmission: '', fuel: '', year: 0 }
  const pairs = specs.split('|')
  pairs.forEach(pair => {
    const [key, value] = pair.split(':')
    switch (key) {
      case '座位数':
        result.seats = parseInt(value) || 0
        break
      case '变速箱':
        result.transmission = value
        break
      case '燃料':
        result.fuel = value
        break
      case '年份':
        result.year = parseInt(value) || 0
        break
    }
  })
  return result
}

const parseFeatures = (features: string | string[]): string[] => {
  if (Array.isArray(features)) return features
  if (typeof features === 'string') {
    return features.split(',').map(f => f.trim()).filter(f => f)
  }
  return []
}

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [loading, setLoading] = useState(false)
  const [vehicleLoading, setVehicleLoading] = useState(true)
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [compareList, setCompareList] = useState<number[]>([])
  const [recommendedVehicles, setRecommendedVehicles] = useState<RecommendItem[]>([])
  const [recommendLoading, setRecommendLoading] = useState(true)
  const [recommendError, setRecommendError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('compareList')
    if (saved) {
      try {
        setCompareList(JSON.parse(saved))
      } catch (e) {
        setCompareList([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList))
  }, [compareList])

  const isInCompare = compareList.includes(Number(id))

  const toggleCompare = () => {
    const vid = Number(id)
    if (isInCompare) {
      setCompareList(compareList.filter(v => v !== vid))
      message.success('已从对比列表移除')
    } else {
      if (compareList.length >= 3) {
        message.warning('最多只能对比3辆车')
        return
      }
      setCompareList([...compareList, vid])
      message.success('已加入对比')
    }
  }

  const goToCompare = () => {
    if (compareList.length < 2) {
      message.warning('请至少选择2辆车进行对比')
      return
    }
    navigate(`/compare?ids=${compareList.join(',')}`)
  }

  useEffect(() => {
    loadVehicle()
  }, [id])

  useEffect(() => {
    if (id) {
      loadRecommendations()
    }
  }, [id])

  const loadRecommendations = async () => {
    setRecommendLoading(true)
    setRecommendError(null)
    try {
      const response = await axios.get(`/api/recommend/vehicle-detail?vehicleId=${id}&limit=4`)
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
        setRecommendedVehicles(data)
      } else {
        setRecommendError('暂无推荐数据')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setRecommendError('请先登录以获取个性化推荐')
      } else {
        setRecommendError(error.response?.data?.message || '加载推荐失败，请稍后重试')
      }
    } finally {
      setRecommendLoading(false)
    }
  }

  const loadVehicle = async () => {
    setVehicleLoading(true)
    setVehicleError(null)
    try {
      const response = await axios.get(`/api/vehicles/${id}`)
      const data = response.data?.data || response.data
      if (data) {
        setVehicle({
          ...data,
          specs: parseSpecs(data.specs),
          features: parseFeatures(data.features)
        })
      } else {
        setVehicleError('车辆信息不存在')
      }
    } catch (error: any) {
      setVehicleError(error.response?.data?.message || '加载车辆信息失败，请稍后重试')
    } finally {
      setVehicleLoading(false)
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

    const token = localStorage.getItem('token')
    if (!token) {
      message.warning('请先登录后再租车')
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/orders', {
        vehicleId: id,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        totalPrice: calculatePrice()
      })
      if (response.data?.code === 200) {
        message.success('订单提交成功！')
        navigate('/orders')
      } else {
        message.error(response.data?.message || '订单提交失败')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录')
        navigate('/login')
      } else {
        message.error(error.response?.data?.message || '订单提交失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  if (vehicleLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" tip="加载车辆信息..." />
      </div>
    )
  }

  if (vehicleError || !vehicle) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto' }}>
        <Alert
          message="加载失败"
          description={vehicleError || '未找到该车辆信息'}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={loadVehicle}>
              重试
            </Button>
          }
        />
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button type="primary" onClick={() => navigate('/vehicles')}>
            返回车辆列表
          </Button>
        </div>
      </div>
    )
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
                  border: 'none',
                  marginBottom: '12px'
                }}
              >
                {vehicle.available ? '立即租车' : '暂不可租'}
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  icon={<SwapOutlined />}
                  onClick={toggleCompare}
                  style={{
                    flex: 1,
                    borderColor: isInCompare ? '#667eea' : undefined,
                    color: isInCompare ? '#667eea' : undefined
                  }}
                >
                  {isInCompare ? '已加入对比' : '加入对比'}
                </Button>
                {compareList.length >= 2 && (
                  <Button
                    type="primary"
                    ghost
                    onClick={goToCompare}
                  >
                    查看对比
                  </Button>
                )}
              </div>

              {compareList.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '8px' }}>
                    对比列表 ({compareList.length}/3)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {compareList.map(vid => (
                      <Tag
                        key={vid}
                        color={vid === Number(id) ? 'blue' : 'default'}
                        closable={vid !== Number(id)}
                        onClose={() => setCompareList(compareList.filter(v => v !== vid))}
                      >
                        车辆 #{vid}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ marginTop: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        title={<span style={{ fontSize: '1.5rem', fontWeight: 600 }}>猜你喜欢</span>}
      >
        {recommendLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="正在加载推荐..." />
          </div>
        ) : recommendError ? (
          <Alert
            message={recommendError}
            description={recommendError.includes('登录') ? '登录后即可根据您的历史租车记录和偏好获取个性化车辆推荐' : '请检查网络连接后重试'}
            type={recommendError.includes('登录') ? 'warning' : 'error'}
            showIcon
            icon={recommendError.includes('登录') ? <LoginOutlined /> : undefined}
            action={
              recommendError.includes('登录') ? (
                <Button size="small" type="primary" onClick={() => navigate('/login')}>
                  去登录
                </Button>
              ) : (
                <Button size="small" onClick={loadRecommendations}>
                  重试
                </Button>
              )
            }
          />
        ) : recommendedVehicles.length === 0 ? (
          <Alert
            message="暂无推荐结果"
            description="系统暂时无法为您生成推荐，请浏览全部车辆"
            type="info"
            showIcon
            action={
              <Button size="small" onClick={() => navigate('/vehicles')}>
                浏览全部
              </Button>
            }
          />
        ) : (
          <Row gutter={[16, 16]}>
            {recommendedVehicles.map(item => (
              <Col xs={24} sm={12} md={6} key={item.vehicle.id}>
                <Link to={`/vehicles/${item.vehicle.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' }}>🚗</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#333' }}>{item.vehicle.name}</h4>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginBottom: '4px' }}>¥{item.vehicle.price}/天</div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>
                      {item.vehicle.type} · ⭐ {item.vehicle.rating}
                    </div>
                    {item.reason && (
                      <div style={{ fontSize: '0.75rem', color: '#667eea', background: '#f0f2ff', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                        💡 {item.reason}
                      </div>
                    )}
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}

export default VehicleDetail
