import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Card, Row, Col, Select, Input, Button, Tag } from 'antd'
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import L from 'leaflet'
import axios from 'axios'

interface VehicleLocation {
  id: number
  name: string
  lat: number
  lng: number
  type: string
  available: boolean
  price: number
  distance?: number
}

const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiM2NjdlZWEiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const MapView: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    loadVehicles()
    getUserLocation()
  }, [])

  const loadVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles/locations')
      setVehicles(response.data)
    } catch (error) {
      setVehicles([
        { id: 1, name: '特斯拉 Model 3', lat: 39.9042, lng: 116.4074, type: '电动车', available: true, price: 299 },
        { id: 2, name: '宝马 5系', lat: 31.2304, lng: 121.4737, type: '轿车', available: true, price: 399 },
        { id: 3, name: '奥迪 A6L', lat: 23.1291, lng: 113.2644, type: '轿车', available: true, price: 359 },
        { id: 4, name: '奔驰 E级', lat: 22.5431, lng: 114.0579, type: '轿车', available: true, price: 429 },
        { id: 5, name: '保时捷 911', lat: 30.2741, lng: 120.1551, type: '跑车', available: true, price: 1299 },
        { id: 6, name: '大众 途观L', lat: 30.5728, lng: 104.0668, type: 'SUV', available: true, price: 259 },
      ])
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

  const filteredVehicles = vehicles.filter(v => {
    const matchCity = selectedCity === 'all' || v.name.includes(selectedCity)
    const matchSearch = v.name.toLowerCase().includes(searchText.toLowerCase())
    return matchCity && matchSearch
  })

  const center = userLocation || [39.9042, 116.4074]

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
          <Col xs={24} md={8}>
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              style={{ width: '100%' }}
              size="large"
              placeholder="选择城市"
            >
              <Select.Option value="all">全部城市</Select.Option>
              <Select.Option value="北京">北京</Select.Option>
              <Select.Option value="上海">上海</Select.Option>
              <Select.Option value="广州">广州</Select.Option>
              <Select.Option value="深圳">深圳</Select.Option>
              <Select.Option value="杭州">杭州</Select.Option>
              <Select.Option value="成都">成都</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Input
              size="large"
              placeholder="搜索车辆名称..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              size="large"
              icon={<EnvironmentOutlined />}
              onClick={getUserLocation}
              block
            >
              定位
            </Button>
          </Col>
        </Row>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#666' }}>快速筛选：</span>
          <Tag
            color="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedCity('all')}
          >
            全部
          </Tag>
          {['电动车', '轿车', 'SUV', '跑车', 'MPV'].map(type => (
            <Tag
              key={type}
              color="purple"
              style={{ cursor: 'pointer' }}
              onClick={() => setSearchText(type)}
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

          {filteredVehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={customIcon}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ marginBottom: '8px' }}>{vehicle.name}</h3>
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
        title="附近车辆"
        style={{
          marginTop: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Row gutter={[16, 16]}>
          {filteredVehicles.slice(0, 6).map(vehicle => (
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
                      <EnvironmentOutlined /> {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}
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
      </Card>
    </div>
  )
}

export default MapView
