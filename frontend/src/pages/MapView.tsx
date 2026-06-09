import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Card, Row, Col, Select, Input, Button, Tag, Slider } from 'antd'
import { EnvironmentOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons'
import L from 'leaflet'
import axios from 'axios'

const { Option } = Select

interface VehicleLocation {
  id: number
  name: string
  lat: number
  lng: number
  type: string
  available: boolean
  price: number
  location: string
  rating: number
  description: string
  distance?: number
}

const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiM2NjdlZWEiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const extractCity = (location: string): string => {
  const match = location.match(/^(.+?)[市区]/)
  return match ? match[1] : location
}

const MapView: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(2000)
  const [availableOnly, setAvailableOnly] = useState<boolean>(true)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [, setLoading] = useState(false)

  useEffect(() => {
    loadVehicles()
    getUserLocation()
  }, [selectedCity, typeFilter, minPrice, maxPrice, availableOnly])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (searchText) params.keyword = searchText
      if (selectedCity) params.city = selectedCity
      if (typeFilter) params.type = typeFilter
      if (minPrice > 0) params.minPrice = minPrice
      if (maxPrice < 2000) params.maxPrice = maxPrice
      if (availableOnly) params.available = true
      params.sortBy = 'rating'
      params.sortOrder = 'desc'

      const response = await axios.get('/api/vehicles/locations', { params })
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
        const vehicles = data.map((v: any) => ({
          id: v.id,
          name: v.name,
          lat: v.latitude || v.lat,
          lng: v.longitude || v.lng,
          type: v.type,
          available: v.available,
          price: v.price,
          location: v.location,
          rating: v.rating,
          description: v.description
        }))
        setVehicles(vehicles)
      } else {
        throw new Error('No data')
      }
    } catch (error) {
      const mockVehicles: VehicleLocation[] = [
        { id: 1, name: '特斯拉 Model 3', lat: 39.9042, lng: 116.4074, type: '电动车', available: true, price: 299, location: '北京市朝阳区', rating: 4.8, description: '高性能纯电动轿车' },
        { id: 2, name: '宝马 5系', lat: 31.2304, lng: 121.4737, type: '轿车', available: true, price: 399, location: '上海市浦东新区', rating: 4.9, description: '豪华商务轿车' },
        { id: 3, name: '奥迪 A6L', lat: 23.1291, lng: 113.2644, type: '轿车', available: true, price: 359, location: '广州市天河区', rating: 4.7, description: '科技感十足的豪华轿车' },
        { id: 4, name: '奔驰 E级', lat: 22.5431, lng: 114.0579, type: '轿车', available: false, price: 429, location: '深圳市南山区', rating: 4.9, description: '尊贵舒适的商务座驾' },
        { id: 5, name: '保时捷 911', lat: 30.2741, lng: 120.1551, type: '跑车', available: true, price: 1299, location: '杭州市西湖区', rating: 5.0, description: '极致驾驶体验' },
        { id: 6, name: '大众 途观L', lat: 30.5728, lng: 104.0668, type: 'SUV', available: true, price: 259, location: '成都市高新区', rating: 4.6, description: '家庭出行首选' },
        { id: 7, name: '丰田 埃尔法', lat: 39.9599, lng: 116.2982, type: 'MPV', available: true, price: 599, location: '北京市海淀区', rating: 4.8, description: '明星保姆车' },
        { id: 8, name: '蔚来 ES8', lat: 31.2297, lng: 121.4498, type: '电动车', available: true, price: 499, location: '上海市静安区', rating: 4.7, description: '智能电动SUV' },
        { id: 9, name: '奥迪 Q5L', lat: 23.1252, lng: 113.2676, type: 'SUV', available: true, price: 379, location: '广州市越秀区', rating: 4.6, description: '全能城市SUV' },
        { id: 10, name: '比亚迪 汉', lat: 22.5431, lng: 114.0579, type: '电动车', available: true, price: 239, location: '深圳市福田区', rating: 4.7, description: '国产旗舰电动轿车' },
        { id: 11, name: '本田 奥德赛', lat: 30.4175, lng: 120.3046, type: 'MPV', available: true, price: 329, location: '杭州市余杭区', rating: 4.5, description: '家用MPV首选' },
        { id: 12, name: '法拉利 488', lat: 39.9219, lng: 116.4435, type: '跑车', available: false, price: 1999, location: '北京市朝阳区', rating: 4.9, description: '意大利超跑' },
      ]

      let filtered = mockVehicles

      if (searchText) {
        filtered = filtered.filter(v =>
          v.name.toLowerCase().includes(searchText.toLowerCase()) ||
          v.type.toLowerCase().includes(searchText.toLowerCase())
        )
      }
      if (selectedCity) {
        filtered = filtered.filter(v => extractCity(v.location) === selectedCity)
      }
      if (typeFilter) {
        filtered = filtered.filter(v => v.type === typeFilter)
      }
      if (minPrice > 0) {
        filtered = filtered.filter(v => v.price >= minPrice)
      }
      if (maxPrice < 2000) {
        filtered = filtered.filter(v => v.price <= maxPrice)
      }
      if (availableOnly) {
        filtered = filtered.filter(v => v.available)
      }

      setVehicles(filtered)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        () => {
          setUserLocation([39.9042, 116.4074])
        }
      )
    } else {
      setUserLocation([39.9042, 116.4074])
    }
  }

  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都']
  const vehicleTypes = ['电动车', '轿车', 'SUV', '跑车', 'MPV']

  const center = userLocation || [39.9042, 116.4074]

  const handleSearch = () => {
    loadVehicles()
  }

  const handlePriceChange = (values: number[]) => {
    setMinPrice(values[0])
    setMaxPrice(values[1])
  }

  return (
    <div>
      <Card
        style={{
          marginBottom: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={5}>
            <Select
              value={selectedCity || undefined}
              onChange={setSelectedCity}
              style={{ width: '100%' }}
              size="large"
              placeholder="选择城市"
              allowClear
            >
              {cities.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={5}>
            <Select
              value={typeFilter || undefined}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              size="large"
              placeholder="选择车型"
              allowClear
            >
              {vehicleTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="搜索车辆名称..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} md={3}>
            <Button
              size="large"
              icon={<EnvironmentOutlined />}
              onClick={getUserLocation}
              block
            >
              定位
            </Button>
          </Col>
          <Col xs={24} md={3}>
            <Button
              type="primary"
              size="large"
              onClick={handleSearch}
              block
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              搜索
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} md={10}>
            <div style={{ padding: '0 8px' }}>
              <div style={{ marginBottom: '8px', color: '#666', fontSize: '0.875rem' }}>
                <FilterOutlined style={{ marginRight: '4px' }} />
                价格区间：¥{minPrice} - ¥{maxPrice}
              </div>
              <Slider
                range
                min={0}
                max={2000}
                step={50}
                value={[minPrice, maxPrice]}
                onChange={handlePriceChange}
                marks={{
                  0: '¥0',
                  500: '¥500',
                  1000: '¥1000',
                  1500: '¥1500',
                  2000: '¥2000+'
                }}
              />
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>可租状态：</span>
              <Select
                value={availableOnly ? 'true' : 'all'}
                onChange={(val) => setAvailableOnly(val === 'true')}
                style={{ flex: 1 }}
                size="large"
              >
                <Option value="all">全部</Option>
                <Option value="true">仅显示可租</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#666' }}>快速筛选：</span>
          <Tag
            color="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => { setSelectedCity(''); setTypeFilter(''); setSearchText('') }}
          >
            全部
          </Tag>
          {vehicleTypes.map(type => (
            <Tag
              key={type}
              color={typeFilter === type ? 'purple' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
            >
              {type}
            </Tag>
          ))}
        </div>
      </Card>

      <Card style={{ borderRadius: '12px', padding: '0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '600px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {vehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={customIcon}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ marginBottom: '8px' }}>{vehicle.name}</h3>
                  <p style={{ marginBottom: '8px', color: '#666', fontSize: '0.875rem' }}>
                    {vehicle.description}
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '1.25rem' }}>
                      ¥{vehicle.price}/天
                    </span>
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <Tag color={vehicle.available ? 'green' : 'red'}>
                      {vehicle.available ? '可租' : '已租满'}
                    </Tag>
                    <Tag color="blue">{vehicle.type}</Tag>
                  </p>
                  <p style={{ marginBottom: '8px', color: '#666', fontSize: '0.875rem' }}>
                    <EnvironmentOutlined /> {vehicle.location}
                  </p>
                  <Button type="primary" size="small" block>
                    查看详情
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>

      <Card
        title={`附近车辆 (${vehicles.length}辆)`}
        style={{
          marginTop: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Row gutter={[16, 16]}>
          {vehicles.slice(0, 6).map(vehicle => (
            <Col xs={24} sm={12} lg={8} key={vehicle.id}>
              <Card
                hoverable
                size="small"
                style={{ borderRadius: '8px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{vehicle.name}</div>
                    <div style={{ color: '#666', fontSize: '0.875rem' }}>
                      <EnvironmentOutlined /> {vehicle.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{vehicle.price}</div>
                    <Tag color={vehicle.available ? 'green' : 'red'} style={{ marginTop: '4px' }}>
                      {vehicle.available ? '可租' : '已租满'}
                    </Tag>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {vehicles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <p>该区域暂无符合条件的车辆</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default MapView
