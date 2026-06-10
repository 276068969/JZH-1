import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input, Select, Button, Card, Row, Col, Statistic, Alert, Spin } from 'antd'
import { SearchOutlined, CarOutlined, EnvironmentOutlined, SafetyOutlined, DollarOutlined, RightOutlined, LoginOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Search } = Input

interface Vehicle {
  id: number
  name: string
  type: string
  price: number
  location: string
  available: boolean
  rating: number
}

interface RecommendItem {
  vehicle: Vehicle
  score: number
  reason: string
}

const extractCity = (location: string): string => {
  const match = location.match(/^(.+?)[市区]/)
  return match ? match[1] : location
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [recommendedVehicles, setRecommendedVehicles] = useState<RecommendItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [vehiclesError, setVehiclesError] = useState<string | null>(null)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [recommendLoading, setRecommendLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
    loadRecommendations()
  }, [])

  const loadVehicles = async () => {
    setVehiclesLoading(true)
    setVehiclesError(null)
    try {
      const response = await axios.get('/api/vehicles')
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
        setVehicles(data)
      } else {
        setVehiclesError('暂无可用车辆数据')
      }
    } catch (error: any) {
      setVehiclesError(error.response?.data?.message || '加载车辆列表失败，请稍后重试')
    } finally {
      setVehiclesLoading(false)
    }
  }

  const loadRecommendations = async () => {
    setRecommendLoading(true)
    setRecommendError(null)
    try {
      const response = await axios.get('/api/recommend/home?limit=6')
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

  const cities = useMemo(() => {
    const citySet = new Set(vehicles.map(v => extractCity(v.location)))
    return ['all', ...Array.from(citySet)]
  }, [vehicles])

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('search', value)
    if (selectedCity !== 'all') params.set('city', selectedCity)
    navigate(`/vehicles?${params.toString()}`)
  }

  const goToVehicleList = (type?: string, city?: string) => {
    const params = new URLSearchParams()
    if (type && type !== 'all') params.set('type', type)
    if (city && city !== 'all') params.set('city', city)
    navigate(`/vehicles?${params.toString()}`)
  }

  const hotTypes = [
    { type: '轿车', icon: '🚙', desc: '舒适商务之选' },
    { type: 'SUV', icon: '🚐', desc: '家庭出游必备' },
    { type: '电动车', icon: '⚡', desc: '绿色环保出行' },
    { type: '跑车', icon: '🏎️', desc: '极致驾驶体验' },
    { type: 'MPV', icon: '🚌', desc: '多人出行首选' },
  ]

  const categoryCards = [
    { title: '商务接待', desc: '豪华轿车车队，专业司机服务', type: '轿车', icon: '🚌', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { title: '家庭出游', desc: '宽敞SUV和MPV，满足全家出行需求', type: 'SUV', icon: '🚐', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  ]

  const renderRecommendContent = () => {
    if (recommendLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="正在为您生成个性化推荐..." />
        </div>
      )
    }

    if (recommendError) {
      const isAuthError = recommendError.includes('登录')
      return (
        <Alert
          message={recommendError}
          description={isAuthError ? '登录后即可根据您的历史租车记录和偏好获取个性化车辆推荐' : '请检查网络连接后重试'}
          type={isAuthError ? 'warning' : 'error'}
          showIcon
          icon={isAuthError ? <LoginOutlined /> : undefined}
          action={
            isAuthError ? (
              <Button size="small" type="primary" onClick={() => navigate('/login')}>
                去登录
              </Button>
            ) : (
              <Button size="small" onClick={loadRecommendations}>
                重试
              </Button>
            )
          }
          style={{ marginBottom: '16px' }}
        />
      )
    }

    if (recommendedVehicles.length === 0) {
      return (
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
      )
    }

    return (
      <div className="vehicle-grid">
        {recommendedVehicles.slice(0, 6).map(item => (
          <Link to={`/vehicles/${item.vehicle.id}`} key={item.vehicle.id} style={{ textDecoration: 'none' }}>
            <div className="vehicle-card">
              <div className="vehicle-image">🚗</div>
              <div className="vehicle-info">
                <h3>{item.vehicle.name}</h3>
                <div className="price">¥{item.vehicle.price}/天</div>
                <div className="tags">
                  <span
                    style={{
                      background: '#e6f7ff',
                      color: '#1890ff',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      goToVehicleList(item.vehicle.type)
                    }}
                  >
                    {item.vehicle.type}
                  </span>
                  <span style={{
                    background: '#f6ffed',
                    color: '#52c41a',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    ⭐ {item.vehicle.rating}
                  </span>
                </div>
                <p style={{ marginTop: '12px', color: '#666', fontSize: '0.875rem' }}>
                  📍 {item.vehicle.location}
                </p>
                {item.reason && (
                  <p style={{ marginTop: '4px', color: '#667eea', fontSize: '0.75rem', background: '#f0f2ff', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    💡 {item.reason}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="hero">
        <h1>🚗 多种车辆出租平台</h1>
        <p>无论是日常通勤还是商务出行，我们都有最适合您的车辆</p>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'stretch'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            borderRadius: '8px',
            padding: '0 12px',
            flexShrink: 0
          }}>
            <EnvironmentOutlined style={{ color: '#667eea', fontSize: '1.125rem' }} />
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              style={{ minWidth: '100px' }}
              size="large"
              bordered={false}
            >
              {cities.map(city => (
                <Select.Option key={city} value={city}>
                  {city === 'all' ? '全部城市' : city}
                </Select.Option>
              ))}
            </Select>
          </div>
          <Search
            placeholder="搜索车辆名称或类型..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
            size="large"
            style={{ flex: 1 }}
            value={searchText}
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {vehiclesLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : vehiclesError ? (
        <Alert
          message={vehiclesError}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={loadVehicles}>
              重试
            </Button>
          }
          style={{ marginBottom: '24px' }}
        />
      ) : (
        <Row gutter={[24, 24]} className="statistics">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="可用车辆"
                value={vehicles.length}
                prefix={<CarOutlined style={{ color: '#667eea' }} />}
                valueStyle={{ color: '#667eea' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="覆盖城市"
                value={cities.length - 1}
                prefix={<EnvironmentOutlined style={{ color: '#764ba2' }} />}
                valueStyle={{ color: '#764ba2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="安全里程"
                value={1000000}
                suffix="公里"
                prefix={<SafetyOutlined style={{ color: '#667eea' }} />}
                valueStyle={{ color: '#667eea' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="用户好评"
                value={98}
                suffix="%"
                prefix={<DollarOutlined style={{ color: '#764ba2' }} />}
                valueStyle={{ color: '#764ba2' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>热门车型</h2>
          <Link
            to="/vehicles"
            style={{ color: '#667eea', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            查看全部 <RightOutlined style={{ fontSize: '0.75rem' }} />
          </Link>
        </div>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {hotTypes.map(item => (
            <Col xs={12} sm={8} md={4} key={item.type}>
              <div
                onClick={() => goToVehicleList(item.type)}
                style={{
                  background: 'white',
                  padding: '20px 16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>{item.type}</div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', marginTop: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>为你推荐</h2>
          <Link
            to={selectedCity !== 'all' ? `/vehicles?city=${selectedCity}` : '/vehicles'}
            style={{ color: '#667eea', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            查看更多 <RightOutlined style={{ fontSize: '0.75rem' }} />
          </Link>
        </div>
        {renderRecommendContent()}
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '24px', color: '#333' }}>出行场景</h2>
        <Row gutter={[24, 24]}>
          {categoryCards.map(card => (
            <Col xs={24} md={12} key={card.title}>
              <Card
                hoverable
                onClick={() => goToVehicleList(card.type)}
                style={{ cursor: 'pointer' }}
                cover={<div style={{ height: '200px', background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>{card.icon}</div>}
              >
                <Card.Meta
                  title={<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{card.title}<RightOutlined style={{ fontSize: '0.875rem', color: '#667eea' }} /></span>}
                  description={card.desc}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{
        marginTop: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '48px 32px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚖️</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: 'white' }}>车辆对比中心</h2>
        <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '24px' }}>
          最多对比3辆车，价格、配置、评分一目了然，帮您快速做出最佳选择
        </p>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/compare')}
          style={{
            height: '48px',
            padding: '0 40px',
            fontSize: '1.125rem',
            background: 'white',
            color: '#667eea',
            border: 'none',
            fontWeight: '600'
          }}
        >
          立即对比
        </Button>
      </div>
    </div>
  )
}

export default Home
