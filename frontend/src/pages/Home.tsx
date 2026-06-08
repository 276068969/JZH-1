import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input, Select, Button, Card, Row, Col, Statistic } from 'antd'
import { SearchOutlined, CarOutlined, EnvironmentOutlined, SafetyOutlined, DollarOutlined, RightOutlined } from '@ant-design/icons'
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

const extractCity = (location: string): string => {
  const match = location.match(/^(.+?)[市区]/)
  return match ? match[1] : location
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('all')

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles')
      setVehicles(response.data)
    } catch (error) {
      setVehicles([
        { id: 1, name: '特斯拉 Model 3', type: '电动车', price: 299, location: '北京市朝阳区', available: true, rating: 4.8 },
        { id: 2, name: '宝马 5系', type: '轿车', price: 399, location: '上海市浦东新区', available: true, rating: 4.9 },
        { id: 3, name: '奥迪 A6L', type: '轿车', price: 359, location: '广州市天河区', available: true, rating: 4.7 },
        { id: 4, name: '奔驰 E级', type: '轿车', price: 429, location: '深圳市南山区', available: true, rating: 4.9 },
        { id: 5, name: '保时捷 911', type: '跑车', price: 1299, location: '杭州市西湖区', available: true, rating: 5.0 },
        { id: 6, name: '大众 途观L', type: 'SUV', price: 259, location: '成都市高新区', available: true, rating: 4.6 },
        { id: 7, name: '丰田 埃尔法', type: 'MPV', price: 599, location: '北京市海淀区', available: true, rating: 4.8 },
        { id: 8, name: '蔚来 ES8', type: '电动车', price: 499, location: '上海市静安区', available: true, rating: 4.7 },
        { id: 9, name: '奥迪 Q5L', type: 'SUV', price: 379, location: '广州市越秀区', available: true, rating: 4.6 },
      ])
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

  const filteredVehicles = vehicles.filter(v => {
    if (searchText && !v.name.toLowerCase().includes(searchText.toLowerCase()) && !v.type.toLowerCase().includes(searchText.toLowerCase())) {
      return false
    }
    if (selectedCity !== 'all' && extractCity(v.location) !== selectedCity) {
      return false
    }
    return true
  })

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
          <h2 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>热门推荐</h2>
          <Link
            to={selectedCity !== 'all' ? `/vehicles?city=${selectedCity}` : '/vehicles'}
            style={{ color: '#667eea', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            查看更多 <RightOutlined style={{ fontSize: '0.75rem' }} />
          </Link>
        </div>
        <div className="vehicle-grid">
          {filteredVehicles.slice(0, 6).map(vehicle => (
            <Link to={`/vehicles/${vehicle.id}`} key={vehicle.id} style={{ textDecoration: 'none' }}>
              <div className="vehicle-card">
                <div className="vehicle-image">🚗</div>
                <div className="vehicle-info">
                  <h3>{vehicle.name}</h3>
                  <div className="price">¥{vehicle.price}/天</div>
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
                        goToVehicleList(vehicle.type)
                      }}
                    >
                      {vehicle.type}
                    </span>
                    <span style={{
                      background: '#f6ffed',
                      color: '#52c41a',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      ⭐ {vehicle.rating}
                    </span>
                  </div>
                  <p style={{ marginTop: '12px', color: '#666', fontSize: '0.875rem' }}>
                    📍 {vehicle.location}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
    </div>
  )
}

export default Home
