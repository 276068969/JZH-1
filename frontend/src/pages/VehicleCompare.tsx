import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Button, Row, Col, Rate, Tag, Empty, Spin, Badge } from 'antd'
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  StarOutlined
} from '@ant-design/icons'
import axios from 'axios'

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
  specs: string | VehicleSpecs
  features: string | string[]
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

const getMockVehicles = (ids: number[]): Vehicle[] => {
  const allVehicles: Vehicle[] = [
    {
      id: 1, name: '特斯拉 Model 3', type: '电动车', price: 299,
      location: '北京市朝阳区', available: true, rating: 4.8,
      description: '高性能纯电动轿车，续航500公里，搭载自动驾驶系统',
      specs: '座位数:5|变速箱:自动|燃料:纯电动|年份:2024',
      features: '自动驾驶,全景天窗,智能互联,快速充电,辅助泊车,OTA升级'
    },
    {
      id: 2, name: '宝马 5系', type: '轿车', price: 399,
      location: '上海市浦东新区', available: true, rating: 4.9,
      description: '豪华商务轿车，舒适驾乘体验',
      specs: '座位数:5|变速箱:自动|燃料:汽油|年份:2024',
      features: '真皮座椅,导航系统,全景天窗,氛围灯,哈曼卡顿音响'
    },
    {
      id: 3, name: '奥迪 A6L', type: '轿车', price: 359,
      location: '广州市天河区', available: true, rating: 4.7,
      description: '科技感十足的豪华轿车',
      specs: '座位数:5|变速箱:自动|燃料:汽油|年份:2024',
      features: '虚拟座舱,矩阵大灯,四驱系统,空气悬架'
    },
    {
      id: 4, name: '奔驰 E级', type: '轿车', price: 429,
      location: '深圳市南山区', available: true, rating: 4.9,
      description: '尊贵舒适的商务座驾',
      specs: '座位数:5|变速箱:自动|燃料:汽油|年份:2024',
      features: '柏林之声,香氛系统,氛围灯,魔术车身控制'
    },
    {
      id: 5, name: '保时捷 911', type: '跑车', price: 1299,
      location: '杭州市西湖区', available: true, rating: 5.0,
      description: '极致驾驶体验，澎湃动力',
      specs: '座位数:2|变速箱:自动|燃料:汽油|年份:2024',
      features: '运动排气,碳陶瓷刹车,Sport Chrono组件,动力转向升级'
    },
    {
      id: 6, name: '大众 途观L', type: 'SUV', price: 259,
      location: '成都市高新区', available: true, rating: 4.6,
      description: '家庭出行首选，宽敞空间',
      specs: '座位数:7|变速箱:自动|燃料:汽油|年份:2024',
      features: '全景天窗,四驱系统,ACC自适应巡航,自动泊车'
    },
    {
      id: 7, name: '丰田 埃尔法', type: 'MPV', price: 599,
      location: '北京市海淀区', available: true, rating: 4.8,
      description: '明星保姆车，豪华舒适',
      specs: '座位数:7|变速箱:自动|燃料:汽油|年份:2024',
      features: '航空座椅,隔音玻璃,车载冰箱,后排娱乐系统'
    },
    {
      id: 8, name: '蔚来 ES8', type: '电动车', price: 499,
      location: '上海市静安区', available: true, rating: 4.7,
      description: '智能电动SUV',
      specs: '座位数:6|变速箱:自动|燃料:纯电动|年份:2024',
      features: 'NOMI助手,换电服务,自动驾驶,女王副驾'
    },
    {
      id: 9, name: '奥迪 Q5L', type: 'SUV', price: 379,
      location: '广州市越秀区', available: true, rating: 4.6,
      description: '全能城市SUV',
      specs: '座位数:5|变速箱:自动|燃料:汽油|年份:2024',
      features: 'quattro四驱,虚拟座舱,矩阵大灯,全景影像'
    }
  ]
  return allVehicles.filter(v => ids.includes(v.id))
}

const VehicleCompare: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  const vehicleIds = useMemo(() => {
    const idsParam = searchParams.get('ids')
    if (!idsParam) return [] as number[]
    return idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
  }, [searchParams])

  useEffect(() => {
    if (vehicleIds.length > 0) {
      loadVehicles()
    }
  }, [vehicleIds])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/vehicles/compare', { ids: vehicleIds })
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
        setVehicles(data)
      } else {
        setVehicles(getMockVehicles(vehicleIds))
      }
    } catch (error) {
      setVehicles(getMockVehicles(vehicleIds))
    } finally {
      setLoading(false)
    }
  }

  const bestPriceIndex = useMemo(() => {
    if (vehicles.length < 2) return -1
    let minIdx = 0
    for (let i = 1; i < vehicles.length; i++) {
      if (vehicles[i].price < vehicles[minIdx].price) minIdx = i
    }
    return minIdx
  }, [vehicles])

  const bestRatingIndex = useMemo(() => {
    if (vehicles.length < 2) return -1
    let maxIdx = 0
    for (let i = 1; i < vehicles.length; i++) {
      if (vehicles[i].rating > vehicles[maxIdx].rating) maxIdx = i
    }
    return maxIdx
  }, [vehicles])

  const mostSeatsIndex = useMemo(() => {
    if (vehicles.length < 2) return -1
    let maxIdx = 0
    for (let i = 1; i < vehicles.length; i++) {
      const seatsI = parseSpecs(vehicles[i].specs).seats
      const seatsMax = parseSpecs(vehicles[maxIdx].specs).seats
      if (seatsI > seatsMax) maxIdx = i
    }
    return maxIdx
  }, [vehicles])

  const handleRemoveVehicle = (id: number) => {
    const newIds = vehicleIds.filter(vid => vid !== id)
    if (newIds.length === 0) {
      navigate('/vehicles')
    } else {
      navigate(`/compare?ids=${newIds.join(',')}`)
    }
  }

  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>()
    vehicles.forEach(v => {
      parseFeatures(v.features).forEach(f => featureSet.add(f))
    })
    return Array.from(featureSet)
  }, [vehicles])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px', color: '#666' }}>加载中...</p>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div style={{ padding: '60px 0' }}>
        <Empty
          description="暂未选择对比车辆"
          style={{ marginBottom: '24px' }}
        />
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" onClick={() => navigate('/vehicles')}>
            去选择车辆
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
          车辆对比 <Tag color="blue">{vehicles.length} 辆车</Tag>
        </h2>
        <div style={{ width: '80px' }} />
      </div>

      <Card
        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{
                  width: '160px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #f0f0f0',
                  textAlign: 'left',
                  fontWeight: '500',
                  color: '#666'
                }}>
                  对比项
                </th>
                {vehicles.map((vehicle) => (
                  <th
                    key={vehicle.id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                      textAlign: 'center',
                      minWidth: '200px',
                      position: 'relative'
                    }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      style={{ position: 'absolute', top: '8px', right: '8px' }}
                      onClick={() => handleRemoveVehicle(vehicle.id)}
                    />
                    <div
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{
                        height: '100px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        marginBottom: '12px'
                      }}>
                        🚗
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '4px' }}>
                        {vehicle.name}
                      </div>
                      <Tag color="blue">{vehicle.type}</Tag>
                    </div>
                  </th>
                ))}
                {vehicles.length < 3 && (
                  <th
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                      textAlign: 'center',
                      minWidth: '200px',
                      verticalAlign: 'middle'
                    }}
                  >
                    <Button
                      type="dashed"
                      onClick={() => navigate('/vehicles')}
                      style={{ height: '100px', width: '100%', borderStyle: 'dashed' }}
                    >
                      + 添加对比车辆
                    </Button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                  <DollarOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                  日租价格
                </td>
                {vehicles.map((vehicle, idx) => (
                  <td key={vehicle.id} style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Badge
                      count={idx === bestPriceIndex ? '最低价' : ''}
                      style={{ backgroundColor: '#52c41a' }}
                    >
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: idx === bestPriceIndex ? '#52c41a' : '#ff4d4f' }}>
                        ¥{vehicle.price}
                      </span>
                      <span style={{ color: '#999' }}>/天</span>
                    </Badge>
                  </td>
                ))}
                {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                  <StarOutlined style={{ marginRight: '8px', color: '#fadb14' }} />
                  用户评分
                </td>
                {vehicles.map((vehicle, idx) => (
                  <td key={vehicle.id} style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Badge
                      count={idx === bestRatingIndex ? '最高' : ''}
                      style={{ backgroundColor: '#722ed1' }}
                    >
                      <div>
                        <Rate disabled defaultValue={vehicle.rating} allowHalf style={{ fontSize: '1rem' }} />
                      </div>
                      <span style={{ fontWeight: 'bold', color: idx === bestRatingIndex ? '#722ed1' : '#666' }}>
                        {vehicle.rating} 分
                      </span>
                    </Badge>
                  </td>
                ))}
                {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                  车辆类型
                </td>
                {vehicles.map((vehicle) => (
                  <td key={vehicle.id} style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Tag color="purple">{vehicle.type}</Tag>
                  </td>
                ))}
                {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                  所在城市
                </td>
                {vehicles.map((vehicle) => (
                  <td key={vehicle.id} style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <span>📍 {vehicle.location}</span>
                  </td>
                ))}
                {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                  可租状态
                </td>
                {vehicles.map((vehicle) => (
                  <td key={vehicle.id} style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Tag color={vehicle.available ? 'success' : 'error'}>
                      {vehicle.available ? '可租' : '已租满'}
                    </Tag>
                  </td>
                ))}
                {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <h3 style={{ fontSize: '1.125rem', margin: '24px 0 16px', paddingBottom: '12px', borderBottom: '2px solid #667eea', display: 'inline-block' }}>
            📊 车辆参数
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '160px', padding: '14px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                    座位数
                  </td>
                  {vehicles.map((vehicle, idx) => {
                    const specs = parseSpecs(vehicle.specs)
                    return (
                      <td key={vehicle.id} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontWeight: idx === mostSeatsIndex ? 'bold' : 'normal', color: idx === mostSeatsIndex ? '#13c2c2' : '#333' }}>
                          {specs.seats} 座
                          {idx === mostSeatsIndex && vehicles.length > 1 && <Tag color="cyan" style={{ marginLeft: '8px' }}>最多</Tag>}
                        </span>
                      </td>
                    )
                  })}
                  {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
                </tr>
                <tr>
                  <td style={{ width: '160px', padding: '14px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                    变速箱
                  </td>
                  {vehicles.map((vehicle) => {
                    const specs = parseSpecs(vehicle.specs)
                    return (
                      <td key={vehicle.id} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        {specs.transmission || '-'}
                      </td>
                    )
                  })}
                  {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
                </tr>
                <tr>
                  <td style={{ width: '160px', padding: '14px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                    燃料类型
                  </td>
                  {vehicles.map((vehicle) => {
                    const specs = parseSpecs(vehicle.specs)
                    return (
                      <td key={vehicle.id} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <Tag color="orange">{specs.fuel || '-'}</Tag>
                      </td>
                    )
                  })}
                  {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
                </tr>
                <tr>
                  <td style={{ width: '160px', padding: '14px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                    出厂年份
                  </td>
                  {vehicles.map((vehicle) => {
                    const specs = parseSpecs(vehicle.specs)
                    return (
                      <td key={vehicle.id} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        {specs.year || '-'} 年
                      </td>
                    )
                  })}
                  {vehicles.length < 3 && <td style={{ borderBottom: '1px solid #f0f0f0' }} />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '0 20px 32px' }}>
          <h3 style={{ fontSize: '1.125rem', margin: '24px 0 16px', paddingBottom: '12px', borderBottom: '2px solid #52c41a', display: 'inline-block' }}>
            ✨ 功能配置
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <tbody>
                {allFeatures.map((feature, fIdx) => (
                  <tr key={feature}>
                    <td style={{ width: '160px', padding: '12px 20px', background: fIdx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0', color: '#333' }}>
                      {feature}
                    </td>
                    {vehicles.map((vehicle) => {
                      const features = parseFeatures(vehicle.features)
                      const hasFeature = features.includes(feature)
                      return (
                        <td key={vehicle.id} style={{ padding: '12px 20px', textAlign: 'center', background: fIdx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }}>
                          {hasFeature ? (
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '1.25rem' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: '1.25rem' }} />
                          )}
                        </td>
                      )
                    })}
                    {vehicles.length < 3 && <td style={{ background: fIdx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0' }} />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {vehicles.length >= 2 && (
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '0 0 12px 12px'
          }}>
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <TrophyOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>性价比推荐</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '4px' }}>
                    {vehicles[bestPriceIndex]?.name}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <StarOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>口碑最佳</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '4px' }}>
                    {vehicles[bestRatingIndex]?.name}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '2rem', marginBottom: '8px', display: 'inline-block' }}>👨‍👩‍👧‍👦</span>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>家庭首选</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '4px' }}>
                    {vehicles[mostSeatsIndex]?.name}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/vehicles')}
          style={{
            height: '48px',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
        >
          继续挑选车辆
        </Button>
      </div>
    </div>
  )
}

export default VehicleCompare
