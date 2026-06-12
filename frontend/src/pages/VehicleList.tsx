import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Input, Select, Row, Col, Rate, Tag, Checkbox, Button, message, Slider, Collapse, Badge } from 'antd'
import { SearchOutlined, EnvironmentOutlined, SwapOutlined, CloseOutlined, FilterOutlined, UserOutlined, ThunderboltOutlined, CarOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Search } = Input
const { Option } = Select

interface Vehicle {
  id: number
  name: string
  type: string
  price: number
  location: string
  latitude?: number
  longitude?: number
  available: boolean
  rating: number
  description: string
  specs?: string
  features?: string
  seats?: number
  fuel?: string
  transmission?: string
  year?: number
}

interface FilterOptions {
  seats: number[]
  fuel: string[]
  transmission: string[]
  types: string[]
}

const extractCity = (location: string): string => {
  const match = location.match(/^(.+?)[市区]/)
  return match ? match[1] : location
}

const fuelLabelMap: Record<string, string> = {
  '汽油': '⛽ 汽油',
  '纯电动': '⚡ 纯电动',
  '混合动力': '🔋 混合动力',
}

const VehicleList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    seats: [],
    fuel: [],
    transmission: [],
    types: [],
  })
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(null)

  const searchText = searchParams.get('search') || ''
  const typeFilter = searchParams.get('type') || ''
  const cityFilter = searchParams.get('city') || ''
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 2000
  const availableFilter = searchParams.get('available') || 'true'
  const sortBy = searchParams.get('sortBy') || 'rating'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const seatsFilter = searchParams.get('seats') || ''
  const fuelFilter = searchParams.get('fuel') || ''
  const transmissionFilter = searchParams.get('transmission') || ''

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [searchParams])

  const loadFilterOptions = async () => {
    try {
      setFilterOptionsError(null)
      const response = await axios.get('/api/vehicles/filter-options')
      const data = response.data?.data || response.data
      if (data) {
        setFilterOptions({
          seats: data.seats || [],
          fuel: data.fuel || [],
          transmission: data.transmission || [],
          types: data.types || [],
        })
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || '筛选条件加载失败，请检查后端服务是否启动'
      setFilterOptionsError(errMsg)
      message.error('筛选条件加载失败：' + errMsg)
    }
  }

  const loadVehicles = async () => {
    setLoading(true)
    try {
      setLoadError(null)
      const params: any = {}
      if (searchText) params.keyword = searchText
      if (cityFilter) params.city = cityFilter
      if (typeFilter) params.type = typeFilter
      if (minPrice > 0) params.minPrice = minPrice
      if (maxPrice < 2000) params.maxPrice = maxPrice
      if (availableFilter !== 'all') params.available = availableFilter === 'true'
      if (sortBy) params.sortBy = sortBy
      if (sortOrder) params.sortOrder = sortOrder
      if (seatsFilter) params.seats = seatsFilter
      if (fuelFilter) params.fuel = fuelFilter
      if (transmissionFilter) params.transmission = transmissionFilter

      const response = await axios.get('/api/vehicles/search', { params })
      const data = response.data?.data || response.data
      if (Array.isArray(data)) {
        setVehicles(data)
      } else {
        throw new Error('接口返回格式错误：缺少 data 数组')
      }
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || '车辆列表加载失败，请检查后端服务是否正常'
      setLoadError(errMsg)
      setVehicles([])
      message.error('车辆列表加载失败：' + errMsg)
    } finally {
      setLoading(false)
    }
  }

  const vehicleTypes = useMemo(() => {
    if (filterOptions.types.length > 0) return filterOptions.types
    const allVehicles = vehicles.length > 0 ? vehicles : [
      { type: '电动车' }, { type: '轿车' }, { type: 'SUV' }, { type: '跑车' }, { type: 'MPV' }
    ]
    const types = [...new Set(allVehicles.map(v => v.type))]
    return types
  }, [vehicles, filterOptions.types])

  const cities = useMemo(() => {
    const allVehicles = vehicles.length > 0 ? vehicles : [
      { location: '北京市朝阳区' }, { location: '上海市浦东新区' }, { location: '广州市天河区' },
      { location: '深圳市南山区' }, { location: '杭州市西湖区' }, { location: '成都市高新区' }
    ]
    const citySet = new Set(allVehicles.map(v => extractCity(v.location)))
    return Array.from(citySet)
  }, [vehicles])

  const updateFilters = (key: string, value: string | number | null) => {
    const params = new URLSearchParams(searchParams)
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value))
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const handleSearch = (value: string) => {
    updateFilters('search', value)
  }

  const handleTypeChange = (value: string) => {
    updateFilters('type', value)
  }

  const handleCityChange = (value: string) => {
    updateFilters('city', value)
  }

  const handlePriceChange = (values: number[]) => {
    const params = new URLSearchParams(searchParams)
    if (values[0] > 0) {
      params.set('minPrice', String(values[0]))
    } else {
      params.delete('minPrice')
    }
    if (values[1] < 2000) {
      params.set('maxPrice', String(values[1]))
    } else {
      params.delete('maxPrice')
    }
    setSearchParams(params)
  }

  const handleAvailableChange = (value: string) => {
    updateFilters('available', value)
  }

  const handleSortChange = (value: string) => {
    const [sortField, sortDir] = value.split('-')
    const params = new URLSearchParams(searchParams)
    params.set('sortBy', sortField)
    params.set('sortOrder', sortDir)
    setSearchParams(params)
  }

  const handleSeatsChange = (value: string) => {
    updateFilters('seats', value)
  }

  const handleFuelChange = (value: string) => {
    updateFilters('fuel', value)
  }

  const handleTransmissionChange = (value: string) => {
    updateFilters('transmission', value)
  }

  const hasActiveFilters = searchText || typeFilter || cityFilter || minPrice > 0 || maxPrice < 2000 || availableFilter !== 'true' || seatsFilter || fuelFilter || transmissionFilter

  const clearAllFilters = () => {
    setSearchParams({ sortBy: 'rating', sortOrder: 'desc' })
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

  const currentSortValue = `${sortBy}-${sortOrder}`

  const specFilterItems = [
    {
      key: 'seats',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserOutlined style={{ color: '#667eea' }} />
          座位数
          {seatsFilter && <Badge count={1} style={{ marginLeft: '4px' }} size="small" />}
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filterOptions.seats.map(seats => (
            <Button
              key={seats}
              size="small"
              type={seatsFilter === String(seats) ? 'primary' : 'default'}
              onClick={() => handleSeatsChange(seatsFilter === String(seats) ? '' : String(seats))}
              style={{
                borderRadius: '20px',
                minWidth: '60px',
                background: seatsFilter === String(seats) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                border: seatsFilter === String(seats) ? 'none' : undefined,
              }}
            >
              {seats}座
            </Button>
          ))}
        </div>
      ),
    },
    {
      key: 'fuel',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ThunderboltOutlined style={{ color: '#fa8c16' }} />
          燃料类型
          {fuelFilter && <Badge count={1} style={{ marginLeft: '4px' }} size="small" />}
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filterOptions.fuel.map(fuel => (
            <Button
              key={fuel}
              size="small"
              type={fuelFilter === fuel ? 'primary' : 'default'}
              onClick={() => handleFuelChange(fuelFilter === fuel ? '' : fuel)}
              style={{
                borderRadius: '20px',
                background: fuelFilter === fuel ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                border: fuelFilter === fuel ? 'none' : undefined,
              }}
            >
              {fuelLabelMap[fuel] || fuel}
            </Button>
          ))}
        </div>
      ),
    },
    {
      key: 'transmission',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CarOutlined style={{ color: '#52c41a' }} />
          变速箱
          {transmissionFilter && <Badge count={1} style={{ marginLeft: '4px' }} size="small" />}
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filterOptions.transmission.map(t => (
            <Button
              key={t}
              size="small"
              type={transmissionFilter === t ? 'primary' : 'default'}
              onClick={() => handleTransmissionChange(transmissionFilter === t ? '' : t)}
              style={{
                borderRadius: '20px',
                background: transmissionFilter === t ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                border: transmissionFilter === t ? 'none' : undefined,
              }}
            >
              {t}
            </Button>
          ))}
        </div>
      ),
    },
  ]

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
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索车辆名称、类型或描述..."
              allowClear
              enterButton={<span><SearchOutlined /> 搜索</span>}
              size="large"
              value={searchText}
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('')
                }
              }}
            />
          </Col>
          <Col xs={12} md={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ color: '#667eea', fontSize: '1.25rem' }} />
              <Select
                value={cityFilter || undefined}
                onChange={handleCityChange}
                style={{ flex: 1 }}
                size="large"
                placeholder="选择城市"
                allowClear
              >
                {cities.map(city => (
                  <Option key={city} value={city}>{city}</Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={typeFilter || undefined}
              onChange={handleTypeChange}
              style={{ width: '100%' }}
              size="large"
              placeholder="全部车型"
              allowClear
            >
              {vehicleTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Select
              value={currentSortValue}
              onChange={handleSortChange}
              style={{ width: '100%' }}
              size="large"
              placeholder="排序方式"
            >
              <Option value="rating-desc">评分从高到低</Option>
              <Option value="rating-asc">评分从低到高</Option>
              <Option value="price-asc">价格从低到高</Option>
              <Option value="price-desc">价格从高到低</Option>
              <Option value="name-asc">名称 A-Z</Option>
              <Option value="name-desc">名称 Z-A</Option>
            </Select>
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
          <Col xs={12} md={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
              <span style={{ color: '#666', fontSize: '0.875rem' }}>可租状态：</span>
              <Select
                value={availableFilter}
                onChange={handleAvailableChange}
                style={{ flex: 1 }}
                size="large"
              >
                <Option value="all">全部</Option>
                <Option value="true">可租</Option>
                <Option value="false">已租满</Option>
              </Select>
            </div>
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={seatsFilter || undefined}
              onChange={handleSeatsChange}
              style={{ width: '100%' }}
              size="large"
              placeholder="座位数"
              allowClear
            >
              {filterOptions.seats.map(s => (
                <Option key={s} value={String(s)}>{s}座</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={fuelFilter || undefined}
              onChange={handleFuelChange}
              style={{ width: '100%' }}
              size="large"
              placeholder="燃料类型"
              allowClear
            >
              {filterOptions.fuel.map(f => (
                <Option key={f} value={f}>{fuelLabelMap[f] || f}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={transmissionFilter || undefined}
              onChange={handleTransmissionChange}
              style={{ width: '100%' }}
              size="large"
              placeholder="变速箱"
              allowClear
            >
              {filterOptions.transmission.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        {filterOptionsError && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#fff2e8',
              border: '1px solid #ffa940',
              borderRadius: '8px',
              color: '#d4380d',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div style={{ flex: 1, fontSize: '0.875rem' }}>
              筛选条件加载失败：{filterOptionsError}
            </div>
            <Button size="small" type="primary" onClick={loadFilterOptions}>
              重试加载
            </Button>
          </div>
        )}

        <Collapse
          ghost
          items={specFilterItems}
          style={{ marginTop: '8px', background: '#fafafa', borderRadius: '8px' }}
        />

        {hasActiveFilters && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '0.875rem' }}>当前筛选：</span>
            {searchText && (
              <Tag color="blue" closable onClose={() => handleSearch('')}>
                关键词：{searchText}
              </Tag>
            )}
            {cityFilter && (
              <Tag color="green" closable onClose={() => handleCityChange('')}>
                城市：{cityFilter}
              </Tag>
            )}
            {typeFilter && (
              <Tag color="purple" closable onClose={() => handleTypeChange('')}>
                车型：{typeFilter}
              </Tag>
            )}
            {seatsFilter && (
              <Tag color="cyan" closable onClose={() => handleSeatsChange('')}>
                座位：{seatsFilter}座
              </Tag>
            )}
            {fuelFilter && (
              <Tag color="orange" closable onClose={() => handleFuelChange('')}>
                燃料：{fuelFilter}
              </Tag>
            )}
            {transmissionFilter && (
              <Tag color="geekblue" closable onClose={() => handleTransmissionChange('')}>
                变速箱：{transmissionFilter}
              </Tag>
            )}
            {(minPrice > 0 || maxPrice < 2000) && (
              <Tag color="orange" closable onClose={() => { updateFilters('minPrice', null); updateFilters('maxPrice', null) }}>
                价格：¥{minPrice} - ¥{maxPrice}
              </Tag>
            )}
            {availableFilter !== 'true' && (
              <Tag color={availableFilter === 'false' ? 'red' : 'default'} closable onClose={() => handleAvailableChange('true')}>
                {availableFilter === 'all' ? '全部车辆' : '已租满'}
              </Tag>
            )}
            <a onClick={clearAllFilters} style={{ fontSize: '0.875rem', marginLeft: '8px' }}>
              清除全部
            </a>
          </div>
        )}
      </div>

      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
            <h3 style={{ color: '#cf1322', marginBottom: '12px' }}>车辆列表加载失败</h3>
            <p style={{ color: '#666', marginBottom: '20px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              {loadError}
            </p>
            <p style={{ color: '#999', fontSize: '0.875rem', marginBottom: '24px' }}>
              请检查后端服务是否正常启动，或联系运维
            </p>
            <Button
              type="primary"
              size="large"
              onClick={loadVehicles}
              loading={loading}
              icon={<ReloadOutlined />}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              重试加载
            </Button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
              共找到 {vehicles.length} 辆车
            </h2>
        <Row gutter={[24, 24]}>
          {vehicles.map(vehicle => (
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
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                  <Tag color={vehicle.available ? 'success' : 'default'}>
                    {vehicle.available ? '可租' : '已租满'}
                  </Tag>
                </div>
                <Link to={`/vehicles/${vehicle.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="vehicle-image" style={{ height: '180px' }}>🚗</div>
                  <div className="vehicle-info">
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>{vehicle.name}</h3>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '12px' }}>
                      {vehicle.description}
                    </p>
                    <div className="price" style={{ fontSize: '1.25rem' }}>¥{vehicle.price}/天</div>
                    <div className="tags" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        background: '#e6f7ff',
                        color: '#1890ff',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {vehicle.type}
                      </span>
                      {vehicle.seats && (
                        <span style={{
                          background: '#e6fffb',
                          color: '#13c2c2',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          {vehicle.seats}座
                        </span>
                      )}
                      {vehicle.fuel && (
                        <span style={{
                          background: vehicle.fuel === '纯电动' ? '#f9f0ff' : '#fff7e6',
                          color: vehicle.fuel === '纯电动' ? '#722ed1' : '#fa8c16',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          {vehicle.fuel === '纯电动' ? '⚡' : '⛽'} {vehicle.fuel}
                        </span>
                      )}
                      {vehicle.transmission && (
                        <span style={{
                          background: '#f6ffed',
                          color: '#52c41a',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          {vehicle.transmission}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Rate disabled value={vehicle.rating} allowHalf style={{ fontSize: '0.875rem' }} />
                        <span style={{ marginLeft: '8px', color: '#666' }}>{vehicle.rating}</span>
                      </div>
                      <span style={{
                        color: '#999',
                        fontSize: '0.75rem'
                      }}>
                        📍 {vehicle.location}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </Col>
          ))}
        </Row>

        {vehicles.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <p>暂无符合条件的车辆</p>
            <p style={{ fontSize: '0.875rem' }}>试试调整筛选条件？</p>
          </div>
        )}
          </>
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
