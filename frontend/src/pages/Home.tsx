import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input, Select, Button, Card, Row, Col, Statistic } from 'antd'
import { SearchOutlined, CarOutlined, EnvironmentOutlined, SafetyOutlined, DollarOutlined } from '@ant-design/icons'
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

const Home: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchText, setSearchText] = useState('')

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
      ])
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchText.toLowerCase()) ||
    v.type.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div>
      <div className="hero">
        <h1>🚗 多种车辆出租平台</h1>
        <p>无论是日常通勤还是商务出行，我们都有最适合您的车辆</p>
        <Search
          placeholder="搜索车辆名称或类型..."
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          size="large"
          style={{ maxWidth: '600px', margin: '0 auto' }}
          onSearch={handleSearch}
        />
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
              value={6}
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

      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', marginTop: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '24px', color: '#333' }}>热门推荐</h2>
        <div className="vehicle-grid">
          {filteredVehicles.slice(0, 6).map(vehicle => (
            <Link to={`/vehicles/${vehicle.id}`} key={vehicle.id} style={{ textDecoration: 'none' }}>
              <div className="vehicle-card">
                <div className="vehicle-image">🚗</div>
                <div className="vehicle-info">
                  <h3>{vehicle.name}</h3>
                  <div className="price">¥{vehicle.price}/天</div>
                  <div className="tags">
                    <span style={{
                      background: '#e6f7ff',
                      color: '#1890ff',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
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

      <Row gutter={[24, 24]} style={{ marginTop: '40px' }}>
        <Col xs={24} md={12}>
          <Card
            hoverable
            cover={<div style={{ height: '200px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🚌</div>}
          >
            <Card.Meta
              title="商务接待"
              description="豪华轿车车队，专业司机服务"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            hoverable
            cover={<div style={{ height: '200px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🚐</div>}
          >
            <Card.Meta
              title="家庭出游"
              description="宽敞SUV和MPV，满足全家出行需求"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home
