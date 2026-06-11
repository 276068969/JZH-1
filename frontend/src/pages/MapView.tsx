import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Card, Row, Col, Select, Input, Button, Tag, Slider, Alert } from 'antd'
import { EnvironmentOutlined, SearchOutlined, FilterOutlined, CarOutlined, AimOutlined, SortAscendingOutlined, TrophyOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
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

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 100) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

const getDistanceColor = (km: number): string => {
  if (km < 5) return '#52c41a'
  if (km < 20) return '#1890ff'
  if (km < 100) return '#faad14'
  return '#ff4d4f'
}

const getDistanceBg = (km: number): string => {
  if (km < 5) return 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
  if (km < 20) return 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
  if (km < 100) return 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)'
  return 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)'
}

const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074]

const defaultIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiM2NjdlZWEiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const selectedIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjIiIGZpbGw9IiNmNTIyMmIiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyMCIgcj0iNiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDMyTDI4IDI4SDIwTDI0IDMyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48]
})

const MapController: React.FC<{ center: [number, number] | null; zoom?: number }> = ({ center, zoom = 15 }) => {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 0.8,
        easeLinearity: 0.25
      })
    }
  }, [center, zoom, map])
  return null
}

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
  const [availableFilter, setAvailableFilter] = useState<string>('true')
  const [sortBy, setSortBy] = useState<string>('distance')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationFailed, setLocationFailed] = useState(false)
  const [locating, setLocating] = useState(false)
  const [, setLoading] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())

  const hasRealLocation = userLocation !== null && !locationFailed

  useEffect(() => {
    loadVehicles()
  }, [selectedCity, typeFilter, minPrice, maxPrice, availableFilter, sortBy])

  useEffect(() => {
    getUserLocation()
  }, [])

  useEffect(() => {
    if (hasRealLocation) {
      loadVehicles()
    }
  }, [userLocation, locationFailed])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (searchText) params.keyword = searchText
      if (selectedCity) params.city = selectedCity
      if (typeFilter) params.type = typeFilter
      if (minPrice > 0) params.minPrice = minPrice
      if (maxPrice < 2000) params.maxPrice = maxPrice
      if (availableFilter !== 'all') params.available = availableFilter === 'true'

      if (hasRealLocation) {
        params.sortBy = sortBy
        params.sortOrder = 'asc'
        params.userLat = userLocation![0]
        params.userLng = userLocation![1]
      } else {
        params.sortBy = sortBy === 'distance' ? 'rating' : sortBy
        params.sortOrder = sortBy === 'distance' ? 'desc' : 'asc'
      }

      const response = await axios.get('/api/vehicles/search', { params })
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((v: any) => {
          const lat = v.latitude || v.lat
          const lng = v.longitude || v.lng
          let distance: number | undefined
          if (hasRealLocation && lat && lng) {
            distance = haversineDistance(userLocation![0], userLocation![1], lat, lng)
          }
          return {
            id: v.id,
            name: v.name,
            lat,
            lng,
            type: v.type,
            available: v.available,
            price: v.price,
            location: v.location,
            rating: v.rating,
            description: v.description,
            distance
          }
        })
        if (sortBy === 'distance' && hasRealLocation) {
          mapped.sort((a: VehicleLocation, b: VehicleLocation) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        }
        setVehicles(mapped)
      } else {
        throw new Error('No data')
      }
    } catch (error) {
      const mockVehicles: VehicleLocation[] = [
        { id: 1, name: '特斯拉 Model 3', lat: 39.9042, lng: 116.4074, type: '电动车', available: true, price: 299, location: '北京市朝阳区', rating: 4.8, description: '高性能纯电动轿车，续航500公里' },
        { id: 2, name: '宝马 5系', lat: 31.2304, lng: 121.4737, type: '轿车', available: true, price: 399, location: '上海市浦东新区', rating: 4.9, description: '豪华商务轿车，舒适驾乘' },
        { id: 3, name: '奥迪 A6L', lat: 23.1291, lng: 113.2644, type: '轿车', available: true, price: 359, location: '广州市天河区', rating: 4.7, description: '科技感十足的豪华轿车' },
        { id: 4, name: '奔驰 E级', lat: 22.5431, lng: 114.0579, type: '轿车', available: false, price: 429, location: '深圳市南山区', rating: 4.9, description: '尊贵舒适的商务座驾' },
        { id: 5, name: '保时捷 911', lat: 30.2741, lng: 120.1551, type: '跑车', available: true, price: 1299, location: '杭州市西湖区', rating: 5.0, description: '极致驾驶体验，澎湃动力' },
        { id: 6, name: '大众 途观L', lat: 30.5728, lng: 104.0668, type: 'SUV', available: true, price: 259, location: '成都市高新区', rating: 4.6, description: '家庭出行首选' },
        { id: 7, name: '丰田 埃尔法', lat: 39.9599, lng: 116.2982, type: 'MPV', available: true, price: 599, location: '北京市海淀区', rating: 4.8, description: '明星保姆车' },
        { id: 8, name: '蔚来 ES8', lat: 31.2297, lng: 121.4498, type: '电动车', available: true, price: 499, location: '上海市静安区', rating: 4.7, description: '智能电动SUV' },
        { id: 9, name: '奥迪 Q5L', lat: 23.1252, lng: 113.2676, type: 'SUV', available: true, price: 379, location: '广州市越秀区', rating: 4.6, description: '全能城市SUV' },
        { id: 10, name: '比亚迪 汉', lat: 22.5431, lng: 114.0579, type: '电动车', available: true, price: 239, location: '深圳市福田区', rating: 4.7, description: '国产旗舰电动轿车' },
        { id: 11, name: '本田 奥德赛', lat: 30.4175, lng: 120.3046, type: 'MPV', available: true, price: 329, location: '杭州市余杭区', rating: 4.5, description: '家用MPV首选' },
        { id: 12, name: '法拉利 488', lat: 39.9219, lng: 116.4435, type: '跑车', available: false, price: 1999, location: '北京市朝阳区', rating: 4.9, description: '意大利超跑，激情澎湃' },
      ]

      if (hasRealLocation) {
        mockVehicles.forEach(v => {
          v.distance = haversineDistance(userLocation![0], userLocation![1], v.lat, v.lng)
        })
      }

      let filtered = mockVehicles

      if (searchText) {
        filtered = filtered.filter(v =>
          v.name.toLowerCase().includes(searchText.toLowerCase()) ||
          v.description.toLowerCase().includes(searchText.toLowerCase()) ||
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
      if (availableFilter !== 'all') {
        filtered = filtered.filter(v => v.available === (availableFilter === 'true'))
      }

      if (sortBy === 'distance' && hasRealLocation) {
        filtered.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      } else if (sortBy === 'price') {
        filtered.sort((a, b) => a.price - b.price)
      } else {
        filtered.sort((a, b) => b.rating - a.rating)
      }

      setVehicles(filtered)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    setLocating(true)
    setLocationFailed(false)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
          setLocationFailed(false)
          setLocating(false)
        },
        () => {
          setUserLocation(null)
          setLocationFailed(true)
          setLocating(false)
        }
      )
    } else {
      setUserLocation(null)
      setLocationFailed(true)
      setLocating(false)
    }
  }

  const vehicleTypes = useMemo(() => {
    const allVehicles = vehicles.length > 0 ? vehicles : [
      { type: '电动车' }, { type: '轿车' }, { type: 'SUV' }, { type: '跑车' }, { type: 'MPV' }
    ] as VehicleLocation[]
    const types = [...new Set(allVehicles.map(v => v.type))]
    return types
  }, [vehicles])

  const cities = useMemo(() => {
    const allVehicles = vehicles.length > 0 ? vehicles : [
      { location: '北京市朝阳区' }, { location: '上海市浦东新区' }, { location: '广州市天河区' },
      { location: '深圳市南山区' }, { location: '杭州市西湖区' }, { location: '成都市高新区' }
    ] as VehicleLocation[]
    const citySet = new Set(allVehicles.map(v => extractCity(v.location)))
    return Array.from(citySet)
  }, [vehicles])

  const rankedVehicles = useMemo(() => {
    if (sortBy === 'distance' && hasRealLocation) {
      return [...vehicles].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    }
    return vehicles
  }, [vehicles, sortBy, hasRealLocation])

  const mapDisplayCenter: [number, number] = userLocation || DEFAULT_CENTER

  const handleSearch = () => {
    loadVehicles()
    setSelectedVehicleId(null)
  }

  const handlePriceChange = (values: number[]) => {
    setMinPrice(values[0])
    setMaxPrice(values[1])
  }

  const handleMarkerClick = useCallback((vehicle: VehicleLocation) => {
    setSelectedVehicleId(vehicle.id)
    setMapCenter([vehicle.lat, vehicle.lng])
    setTimeout(() => {
      const cardElement = cardRefs.current.get(vehicle.id)
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        cardElement.style.transition = 'box-shadow 0.3s, transform 0.3s'
        cardElement.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)'
        cardElement.style.transform = 'scale(1.02)'
        setTimeout(() => {
          cardElement.style.boxShadow = ''
          cardElement.style.transform = ''
        }, 1500)
      }
    }, 100)
  }, [])

  const handleCardClick = useCallback((vehicle: VehicleLocation) => {
    setSelectedVehicleId(vehicle.id)
    setMapCenter([vehicle.lat, vehicle.lng])
  }, [])

  const setCardRef = useCallback((id: number, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element)
    } else {
      cardRefs.current.delete(id)
    }
  }, [])

  useEffect(() => {
    if (selectedVehicleId) {
      const exists = vehicles.some(v => v.id === selectedVehicleId)
      if (!exists) {
        setSelectedVehicleId(null)
      }
    }
  }, [vehicles, selectedVehicleId])

  const getRankBadge = (index: number) => {
    if (index === 0) return { bg: 'linear-gradient(135deg, #ffd700 0%, #ffb800 100%)', color: '#8B6914', label: '1' }
    if (index === 1) return { bg: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)', color: '#555', label: '2' }
    if (index === 2) return { bg: 'linear-gradient(135deg, #cd7f32 0%, #b8690e 100%)', color: '#fff', label: '3' }
    return null
  }

  const renderLocationTag = () => {
    if (locating) {
      return (
        <Tag icon={<AimOutlined />} color="processing" style={{ margin: 0, fontSize: '0.8rem', padding: '4px 10px' }}>
          定位中...
        </Tag>
      )
    }
    if (hasRealLocation) {
      return (
        <Tag icon={<AimOutlined />} color="green" style={{ margin: 0, fontSize: '0.8rem', padding: '4px 10px' }}>
          已定位 ({userLocation![0].toFixed(2)}, {userLocation![1].toFixed(2)})
        </Tag>
      )
    }
    if (locationFailed) {
      return (
        <Tag icon={<ExclamationCircleOutlined />} color="error" style={{ margin: 0, fontSize: '0.8rem', padding: '4px 10px', cursor: 'pointer' }} onClick={getUserLocation}>
          定位失败，点击重试
        </Tag>
      )
    }
    return (
      <Tag icon={<AimOutlined />} color="default" style={{ margin: 0, fontSize: '0.8rem', padding: '4px 10px' }}>
        未定位
      </Tag>
    )
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
          <Col xs={24} md={6}>
            <Input
              size="large"
              placeholder="搜索车辆名称..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              size="large"
              icon={locating ? <ReloadOutlined spin /> : <AimOutlined />}
              onClick={getUserLocation}
              block
              disabled={locating}
            >
              {locating ? '定位中' : '定位'}
            </Button>
          </Col>
          <Col xs={24} md={4}>
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
          <Col xs={24} md={8}>
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
          <Col xs={24} md={5}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>可租状态：</span>
              <Select
                value={availableFilter}
                onChange={setAvailableFilter}
                style={{ flex: 1 }}
                size="large"
              >
                <Option value="all">全部</Option>
                <Option value="true">可租</Option>
                <Option value="false">已租满</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} md={5}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
              <SortAscendingOutlined style={{ color: hasRealLocation || sortBy !== 'distance' ? '#667eea' : '#d9d9d9' }} />
              <span style={{ color: '#666', fontSize: '0.875rem' }}>排序：</span>
              <Select
                value={hasRealLocation ? sortBy : (sortBy === 'distance' ? 'rating' : sortBy)}
                onChange={setSortBy}
                style={{ flex: 1 }}
                size="large"
              >
                <Option value="distance" disabled={!hasRealLocation}>
                  距离最近{!hasRealLocation ? '（需定位）' : ''}
                </Option>
                <Option value="price">价格最低</Option>
                <Option value="rating">评分最高</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '8px' }}>
              {renderLocationTag()}
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#666' }}>快速筛选：</span>
          <Tag
            color="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => { setSelectedCity(''); setTypeFilter(''); setSearchText(''); setSelectedVehicleId(null) }}
          >
            全部
          </Tag>
          {vehicleTypes.map(type => (
            <Tag
              key={type}
              color={typeFilter === type ? 'purple' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => { setTypeFilter(typeFilter === type ? '' : type); setSelectedVehicleId(null) }}
            >
              {type}
            </Tag>
          ))}
        </div>
      </Card>

      <Card style={{ borderRadius: '12px', padding: '0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <MapContainer
          center={mapDisplayCenter}
          zoom={12}
          style={{ height: '600px', width: '100%' }}
        >
          <MapController center={mapCenter} zoom={15} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {vehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={selectedVehicleId === vehicle.id ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => handleMarkerClick(vehicle)
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ marginBottom: '8px' }}>{vehicle.name}</h3>
                  <p style={{ marginBottom: '8px', color: '#666', fontSize: '0.875rem' }}>
                    {vehicle.description}
                  </p>
                  {hasRealLocation && vehicle.distance !== undefined && (
                    <p style={{ marginBottom: '8px' }}>
                      <span style={{
                        background: getDistanceBg(vehicle.distance),
                        color: getDistanceColor(vehicle.distance),
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        <AimOutlined /> 距您 {formatDistance(vehicle.distance)}
                      </span>
                    </p>
                  )}
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
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '1.2rem' }} />
            <span>附近车辆距离榜</span>
            <Tag color="blue" style={{ marginLeft: '4px' }}>{rankedVehicles.length}辆</Tag>
            {hasRealLocation && sortBy === 'distance' && (
              <Tag color="green" style={{ marginLeft: '4px' }}>按距离排序</Tag>
            )}
            {!hasRealLocation && sortBy === 'distance' && (
              <Tag color="orange" style={{ marginLeft: '4px' }}>按评分排序（未定位）</Tag>
            )}
            {selectedVehicleId && (
              <Tag color="purple" style={{ marginLeft: '4px' }}>
                已选中 1 辆
              </Tag>
            )}
          </span>
        }
        extra={
          selectedVehicleId ? (
            <Button size="small" onClick={() => setSelectedVehicleId(null)}>
              取消选中
            </Button>
          ) : null
        }
        style={{
          marginTop: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {locationFailed && (
          <Alert
            message="无法获取您的位置"
            description="定位失败，无法按距离排序附近车辆。请检查浏览器定位权限，或点击「定位」按钮重试。当前列表按评分排序展示。"
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            action={
              <Button size="small" type="primary" onClick={getUserLocation} icon={<ReloadOutlined />}>
                重新定位
              </Button>
            }
            style={{ marginBottom: '16px', borderRadius: '8px' }}
          />
        )}

        {!locationFailed && !hasRealLocation && !locating && (
          <Alert
            message="尚未定位"
            description="开启定位后即可按距离查看附近车辆，快速找到离您最近的可租车辆。"
            type="info"
            showIcon
            icon={<AimOutlined />}
            action={
              <Button size="small" type="primary" onClick={getUserLocation} icon={<AimOutlined />}>
                开始定位
              </Button>
            }
            style={{ marginBottom: '16px', borderRadius: '8px' }}
          />
        )}

        <Row gutter={[16, 16]}>
          {rankedVehicles.map((vehicle, index) => {
            const rankBadge = getRankBadge(index)
            const distKm = vehicle.distance ?? 0
            const showDistance = hasRealLocation && vehicle.distance !== undefined
            const showRank = hasRealLocation && sortBy === 'distance'
            return (
              <Col xs={24} sm={12} lg={8} key={vehicle.id}>
                <div
                  ref={(el) => setCardRef(vehicle.id, el)}
                  onClick={() => handleCardClick(vehicle)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedVehicleId === vehicle.id ? '2px solid #667eea' : '1px solid #f0f0f0',
                    borderRadius: '12px',
                    background: selectedVehicleId === vehicle.id
                      ? 'linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%)'
                      : index < 3 && showRank
                        ? getDistanceBg(distKm)
                        : 'white',
                    boxShadow: selectedVehicleId === vehicle.id
                      ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                      : index < 3 && showRank
                        ? '0 2px 8px rgba(0,0,0,0.06)'
                        : 'none',
                    transform: selectedVehicleId === vehicle.id ? 'translateY(-2px)' : 'translateY(0)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {rankBadge && showRank && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '28px',
                      height: '28px',
                      background: rankBadge.bg,
                      color: rankBadge.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      borderBottomRightRadius: '8px',
                      zIndex: 1
                    }}>
                      {rankBadge.label}
                    </div>
                  )}

                  {showRank && !rankBadge && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '28px',
                      height: '28px',
                      background: '#f0f0f0',
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      borderBottomRightRadius: '8px',
                      zIndex: 1
                    }}>
                      {index + 1}
                    </div>
                  )}

                  <Card
                    size="small"
                    style={{
                      borderRadius: '12px',
                      background: 'transparent',
                      border: 'none'
                    }}
                    bodyStyle={{ padding: '14px 12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 'bold',
                          marginBottom: '6px',
                          color: selectedVehicleId === vehicle.id ? '#667eea' : '#333',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.95rem'
                        }}>
                          <CarOutlined style={{ fontSize: '1rem', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vehicle.name}</span>
                        </div>
                        <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '6px' }}>
                          <EnvironmentOutlined /> {vehicle.location}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Tag color="blue" style={{ margin: 0, fontSize: '0.75rem' }}>{vehicle.type}</Tag>
                          <Tag
                            color={vehicle.available ? 'green' : 'red'}
                            style={{ margin: 0, fontSize: '0.75rem' }}
                          >
                            {vehicle.available ? '可租' : '已租满'}
                          </Tag>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {showDistance && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: getDistanceBg(distKm),
                            border: `1px solid ${getDistanceColor(distKm)}22`,
                            textAlign: 'center'
                          }}>
                            <div style={{
                              color: getDistanceColor(distKm),
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              lineHeight: 1.2
                            }}>
                              {formatDistance(distKm)}
                            </div>
                            <div style={{
                              color: getDistanceColor(distKm),
                              fontSize: '0.65rem',
                              opacity: 0.7
                            }}>
                              距您
                            </div>
                          </div>
                        )}
                        <div style={{
                          color: '#ff4d4f',
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          ¥{vehicle.price}
                          <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 'normal' }}>/天</span>
                        </div>
                      </div>
                    </div>
                    {selectedVehicleId === vehicle.id && (
                      <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px dashed #d6e4ff',
                        fontSize: '0.75rem',
                        color: '#667eea',
                        textAlign: 'center'
                      }}>
                        📍 地图上已定位
                      </div>
                    )}
                  </Card>
                </div>
              </Col>
            )
          })}
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
