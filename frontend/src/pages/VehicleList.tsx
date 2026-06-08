import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input, Select, Row, Col, Rate } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
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
  description: string
}

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [searchText, typeFilter, vehicles])

  const loadVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles')
      setVehicles(response.data)
    } catch (error) {
      setVehicles([
        { id: 1, name: '特斯拉 Model 3', type: '电动车', price: 299, location: '北京市朝阳区', available: true, rating: 4.8, description: '高性能纯电动轿车' },
        { id: 2, name: '宝马 5系', type: '轿车', price: 399, location: '上海市浦东新区', available: true, rating: 4.9, description: '豪华商务轿车' },
        { id: 3, name: '奥迪 A6L', type: '轿车', price: 359, location: '广州市天河区', available: true, rating: 4.7, description: '科技感十足的豪华轿车' },
        { id: 4, name: '奔驰 E级', type: '轿车', price: 429, location: '深圳市南山区', available: true, rating: 4.9, description: '尊贵舒适的商务座驾' },
        { id: 5, name: '保时捷 911', type: '跑车', price: 1299, location: '杭州市西湖区', available: true, rating: 5.0, description: '极致驾驶体验' },
        { id: 6, name: '大众 途观L', type: 'SUV', price: 259, location: '成都市高新区', available: true, rating: 4.6, description: '家庭出行首选' },
        { id: 7, name: '丰田 埃尔法', type: 'MPV', price: 599, location: '北京市海淀区', available: true, rating: 4.8, description: '明星保姆车' },
        { id: 8, name: '蔚来 ES8', type: '电动车', price: 499, location: '上海市静安区', available: true, rating: 4.7, description: '智能电动SUV' },
        { id: 9, name: '奥迪 Q5L', type: 'SUV', price: 379, location: '广州市越秀区', available: true, rating: 4.6, description: '全能城市SUV' },
      ])
    }
  }

  const filterVehicles = () => {
    let filtered = vehicles

    if (searchText) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchText.toLowerCase()) ||
        v.description.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.type === typeFilter)
    }

    setFilteredVehicles(filtered)
  }

  const vehicleTypes = ['all', ...new Set(vehicles.map(v => v.type))]

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="搜索车辆名称..."
              allowClear
              enterButton={<span><SearchOutlined /> 搜索</span>}
              size="large"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>筛选类型：</span>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: '200px' }}
                size="large"
              >
                {vehicleTypes.map(type => (
                  <Select.Option key={type} value={type}>
                    {type === 'all' ? '全部类型' : type}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
          共找到 {filteredVehicles.length} 辆车
        </h2>
        <Row gutter={[24, 24]}>
          {filteredVehicles.map(vehicle => (
            <Col xs={24} sm={12} lg={8} key={vehicle.id}>
              <Link to={`/vehicles/${vehicle.id}`} style={{ textDecoration: 'none' }}>
                <div className="vehicle-card" style={{ height: '100%' }}>
                  <div className="vehicle-image" style={{ height: '180px' }}>🚗</div>
                  <div className="vehicle-info">
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>{vehicle.name}</h3>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '12px' }}>
                      {vehicle.description}
                    </p>
                    <div className="price" style={{ fontSize: '1.25rem' }}>¥{vehicle.price}/天</div>
                    <div className="tags" style={{ marginTop: '12px' }}>
                      <span style={{
                        background: '#e6f7ff',
                        color: '#1890ff',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {vehicle.type}
                      </span>
                      <span style={{
                        background: '#fff7e6',
                        color: '#fa8c16',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        📍 {vehicle.location}
                      </span>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <Rate disabled defaultValue={vehicle.rating} allowHalf style={{ fontSize: '0.875rem' }} />
                      <span style={{ marginLeft: '8px', color: '#666' }}>{vehicle.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}

export default VehicleList
