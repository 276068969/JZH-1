import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Input, Select, Row, Col, Rate, Tag, Checkbox, Button, message } from 'antd'
import { SearchOutlined, EnvironmentOutlined, SwapOutlined, CloseOutlined } from '@ant-design/icons'
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

const extractCity = (location: string): string => {
  const match = location.match(/^(.+?)[市区]/)
  return match ? match[1] : location
}

const VehicleList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || 'all')
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get('city') || 'all')
  const [compareIds, setCompareIds] = useState<number[]>([])

  useEffect(() => {
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const city = searchParams.get('city') || 'all'
    setSearchText(search)
    setTypeFilter(type)
    setCityFilter(city)
  }, [searchParams])

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [searchText, typeFilter, cityFilter, vehicles])

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
        v.description.toLowerCase().includes(searchText.toLowerCase()) ||
        v.type.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.type === typeFilter)
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter(v => extractCity(v.location) === cityFilter)
    }

    setFilteredVehicles(filtered)
  }

  const vehicleTypes = useMemo(() => {
    const types = ['all', ...new Set(vehicles.map(v => v.type))]
    return types
  }, [vehicles])

  const cities = useMemo(() => {
    const citySet = new Set(vehicles.map(v => extractCity(v.location)))
    return ['all', ...Array.from(citySet)]
  }, [vehicles])

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    updateFilters('search', value)
  }

  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    updateFilters('type', value)
  }

  const handleCityChange = (value: string) => {
    setCityFilter(value)
    updateFilters('city', value)
  }

  const hasActiveFilters = searchText || typeFilter !== 'all' || cityFilter !== 'all'

  const clearAllFilters = () => {
    setSearchText('')
    setTypeFilter('all')
    setCityFilter('all')
    setSearchParams({})
  }

  const toggleCompare = (id: number) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(vid => vid !== id))
    } else {
      if (compareIds.length >= 3) {
        message.warning('最多只能选择3辆车进行对比')
        return
      }
      setCompareIds([...compareIds, id])
    }
  }

  const removeFromCompare = (id: number) => {
    setCompareIds(compareIds.filter(vid => vid !== id))
  }

  const clearCompare = () => {
    setCompareIds([])
  }

  const goToCompare = () => {
    if (compareIds.length < 2) {
      message.warning('请至少选择2辆车进行对比')
      return
    }
    navigate(`/compare?ids=${compareIds.join(',')}`)
  }

  const selectedVehicles = useMemo(() => {
    return vehicles.filter(v => compareIds.includes(v.id))
  }, [vehicles, compareIds])

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
          <Col xs={24} md={10}>
            <Search
              placeholder="搜索车辆名称、类型或描述..."
              allowClear
              enterButton={<span><SearchOutlined /> 搜索</span>}
              size="large"
              value={searchText}
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={7}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ color: '#667eea', fontSize: '1.25rem' }} />
              <Select
                value={cityFilter}
                onChange={handleCityChange}
                style={{ flex: 1 }}
                size="large"
                placeholder="选择城市"
              >
                {cities.map(city => (
                  <Select.Option key={city} value={city}>
                    {city === 'all' ? '全部城市' : city}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} md={7}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>车型：</span>
              <Select
                value={typeFilter}
                onChange={handleTypeChange}
                style={{ flex: 1 }}
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

        {hasActiveFilters && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '0.875rem' }}>当前筛选：</span>
            {searchText && (
              <Tag color="blue" closable onClose={() => handleSearch('')}>
                关键词：{searchText}
              </Tag>
            )}
            {cityFilter !== 'all' && (
              <Tag color="green" closable onClose={() => handleCityChange('all')}>
                城市：{cityFilter}
              </Tag>
            )}
            {typeFilter !== 'all' && (
              <Tag color="purple" closable onClose={() => handleTypeChange('all')}>
                车型：{typeFilter}
              </Tag>
            )}
            <a onClick={clearAllFilters} style={{ fontSize: '0.875rem', marginLeft: '8px' }}>
              清除全部
            </a>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
          共找到 {filteredVehicles.length} 辆车
        </h2>
        <Row gutter={[24, 24]}>
          {filteredVehicles.map(vehicle => (
            <Col xs={24} sm={12} lg={8} key={vehicle.id}>
              <div className="vehicle-card" style={{
                height: '100%',
                position: 'relative',
                border: compareIds.includes(vehicle.id) ? '2px solid #667eea' : '1px solid #f0f0f0',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'white',
                transition: 'all 0.3s'
              }}>
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                  <Checkbox
                    checked={compareIds.includes(vehicle.id)}
                    onChange={() => toggleCompare(vehicle.id)}
                    style={{
                      background: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
                <Link to={`/vehicles/${vehicle.id}`} style={{ textDecoration: 'none', display: 'block' }}>
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
                </Link>
              </div>
            </Col>
          ))}
        </Row>

        {filteredVehicles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <p>暂无符合条件的车辆</p>
            <p style={{ fontSize: '0.875rem' }}>试试调整筛选条件？</p>
          </div>
        )}
      </div>

      {compareIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '90%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SwapOutlined style={{ color: '#667eea', fontSize: '1.25rem' }} />
            <span style={{ fontWeight: '500' }}>已选 {compareIds.length} 辆车</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flex: 1, overflow: 'auto' }}>
            {selectedVehicles.map(v => (
              <Tag
                key={v.id}
                closable
                onClose={() => removeFromCompare(v.id)}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.875rem',
                  background: '#f0f5ff',
                  borderColor: '#667eea',
                  color: '#667eea'
                }}
              >
                {v.name}
              </Tag>
            ))}
          </div>
          <Button
            type="text"
            size="small"
            onClick={clearCompare}
            icon={<CloseOutlined />}
          >
            清空
          </Button>
          <Button
            type="primary"
            onClick={goToCompare}
            disabled={compareIds.length < 2}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            开始对比
          </Button>
        </div>
      )}
    </div>
  )
}

export default VehicleList
