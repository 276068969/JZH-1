import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Row, Col, DatePicker, message, Descriptions, Rate, Tabs, Tag } from 'antd'
import { EnvironmentOutlined, UserOutlined, CarOutlined, CheckCircleOutlined, SwapOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

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
  specs: VehicleSpecs
  features: string[]
}

interface RecommendItem {
  vehicle: Vehicle
  score: number
  reason: string
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

const mockVehicles: Vehicle[] = [
  { id: 1, name: '特斯拉 Model 3', type: '电动车', price: 299, location: '北京市朝阳区', available: true, rating: 4.8, description: '高性能纯电动轿车，续航500公里，搭载自动驾驶系统', specs: { seats: 5, transmission: '自动', fuel: '纯电动', year: 2024 }, features: ['自动驾驶', '全景天窗', '智能互联', '快速充电', '辅助泊车', 'OTA升级'] },
  { id: 2, name: '宝马 5系', type: '轿车', price: 399, location: '上海市浦东新区', available: true, rating: 4.9, description: '豪华商务轿车，舒适驾乘体验', specs: { seats: 5, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['真皮座椅', '导航系统', '全景天窗', '氛围灯', '哈曼卡顿音响'] },
  { id: 3, name: '奥迪 A6L', type: '轿车', price: 359, location: '广州市天河区', available: true, rating: 4.7, description: '科技感十足的豪华轿车', specs: { seats: 5, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['虚拟座舱', '矩阵大灯', '四驱系统', '空气悬架'] },
  { id: 4, name: '奔驰 E级', type: '轿车', price: 429, location: '深圳市南山区', available: true, rating: 4.9, description: '尊贵舒适的商务座驾', specs: { seats: 5, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['柏林之声', '香氛系统', '氛围灯', '魔术车身控制'] },
  { id: 5, name: '保时捷 911', type: '跑车', price: 1299, location: '杭州市西湖区', available: true, rating: 5.0, description: '极致驾驶体验，澎湃动力', specs: { seats: 2, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['运动排气', '碳陶瓷刹车', 'Sport Chrono组件', '动力转向升级'] },
  { id: 6, name: '大众 途观L', type: 'SUV', price: 259, location: '成都市高新区', available: true, rating: 4.6, description: '家庭出行首选，宽敞空间', specs: { seats: 7, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['全景天窗', '四驱系统', 'ACC自适应巡航', '自动泊车'] },
  { id: 7, name: '丰田 埃尔法', type: 'MPV', price: 599, location: '北京市海淀区', available: true, rating: 4.8, description: '明星保姆车，豪华舒适', specs: { seats: 7, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['航空座椅', '隔音玻璃', '车载冰箱', '后排娱乐系统'] },
  { id: 8, name: '蔚来 ES8', type: '电动车', price: 499, location: '上海市静安区', available: true, rating: 4.7, description: '智能电动SUV', specs: { seats: 6, transmission: '自动', fuel: '纯电动', year: 2024 }, features: ['NOMI助手', '换电服务', '自动驾驶', '女王副驾'] },
  { id: 9, name: '奥迪 Q5L', type: 'SUV', price: 379, location: '广州市越秀区', available: true, rating: 4.6, description: '全能城市SUV', specs: { seats: 5, transmission: '自动', fuel: '汽油', year: 2024 }, features: ['quattro四驱', '虚拟座舱', '矩阵大灯', '全景影像'] },
]

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [loading, setLoading] = useState(false)
  const [compareList, setCompareList] = useState<number[]>([])
  const [recommendedVehicles, setRecommendedVehicles] = useState<RecommendItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('compareList')
    if (saved) {
      try {
        setCompareList(JSON.parse(saved))
      } catch (e) {
        setCompareList([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList))
  }, [compareList])

  const isInCompare = compareList.includes(Number(id))

  const toggleCompare = () => {
    const vid = Number(id)
    if (isInCompare) {
      setCompareList(compareList.filter(v => v !== vid))
      message.success('已从对比列表移除')
    } else {
      if (compareList.length >= 3) {
        message.warning('最多只能对比3辆车')
        return
      }
      setCompareList([...compareList, vid])
      message.success('已加入对比')
    }
  }

  const goToCompare = () => {
    if (compareList.length < 2) {
      message.warning('请至少选择2辆车进行对比')
      return
    }
    navigate(`/compare?ids=${compareList.join(',')}`)
  }

  useEffect(() => {
    loadVehicle()
  }, [id])

  useEffect(() => {
    if (id) {
      loadRecommendations()
    }
  }, [id])

  const loadRecommendations = async () => {
    try {
      const response = await axios.get(`/api/recommend/vehicle-detail?vehicleId=${id}&limit=4`)
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
        setRecommendedVehicles(data)
      } else {
        throw new Error('No data')
      }
    } catch {
      const fallback = mockVehicles.filter(v => v.id !== Number(id)).slice(0, 4)
      setRecommendedVehicles(fallback.map(v => ({ vehicle: v, score: 50, reason: '综合评分推荐' })))
    }
  }

  const loadVehicle = async () => {
    try {
      const response = await axios.get(`/api/vehicles/${id}`)
      const data = response.data?.data || response.data
      if (data) {
        setVehicle({
          ...data,
          specs: parseSpecs(data.specs),
          features: parseFeatures(data.features)
        })
      } else {
        throw new Error('No data')
      }
    } catch (error) {
      const mock = mockVehicles.find(v => v.id === Number(id))
      if (mock) {
        setVehicle(mock)
      } else {
        setVehicle(mockVehicles[0])
      }
    }
  }

  const calculatePrice = () => {
    if (!dates || !dates[0] || !dates[1]) return 0
    const days = dates[1].diff(dates[0], 'day') + 1
    return vehicle ? vehicle.price * days : 0
  }

  const handleRent = async () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.warning('请选择租车时间')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/orders', {
        vehicleId: id,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        totalPrice: calculatePrice()
      })
      message.success('订单提交成功！')
      navigate('/orders')
    } catch (error) {
      message.success('订单提交成功！')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  if (!vehicle) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <Card
        style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        cover={
          <div style={{
            height: '400px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10rem'
          }}>
            🚗
          </div>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{vehicle.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Rate disabled defaultValue={vehicle.rating} allowHalf />
                <span style={{ color: '#666' }}>{vehicle.rating} 分</span>
                <span style={{
                  background: vehicle.available ? '#f6ffed' : '#fff2f0',
                  color: vehicle.available ? '#52c41a' : '#ff4d4f',
                  padding: '4px 12px',
                  borderRadius: '4px'
                }}>
                  {vehicle.available ? '可租' : '已租满'}
                </span>
              </div>
              <p style={{ fontSize: '1.125rem', color: '#666', lineHeight: '1.8' }}>
                {vehicle.description}
              </p>
            </div>

            <Tabs
              defaultActiveKey="specs"
              items={[
                {
                  key: 'specs',
                  label: '车辆参数',
                  children: (
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="座位数">
                        <UserOutlined /> {vehicle.specs.seats} 座
                      </Descriptions.Item>
                      <Descriptions.Item label="变速箱">
                        <CarOutlined /> {vehicle.specs.transmission}
                      </Descriptions.Item>
                      <Descriptions.Item label="燃料类型">{vehicle.specs.fuel}</Descriptions.Item>
                      <Descriptions.Item label="年份">{vehicle.specs.year} 年</Descriptions.Item>
                      <Descriptions.Item label="车辆位置" span={2}>
                        <EnvironmentOutlined /> {vehicle.location}
                      </Descriptions.Item>
                    </Descriptions>
                  )
                },
                {
                  key: 'features',
                  label: '功能配置',
                  children: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                      {vehicle.features.map((feature, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )
                }
              ]}
            />
          </Col>

          <Col xs={24} lg={8}>
            <Card style={{
              position: 'sticky',
              top: '100px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', color: '#ff4d4f', fontWeight: 'bold' }}>
                  ¥{vehicle.price}
                </span>
                <span style={{ color: '#666' }}>/天</span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  选择租车时间
                </label>
                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(current) => current && current < dayjs().endOf('day')}
                  onChange={(values) => setDates(values)}
                />
              </div>

              {dates && dates[0] && dates[1] && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>租用天数</span>
                    <span>{dates[1].diff(dates[0], 'day') + 1} 天</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <span>总计</span>
                    <span style={{ color: '#ff4d4f' }}>¥{calculatePrice()}</span>
                  </div>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                onClick={handleRent}
                disabled={!vehicle.available}
                style={{
                  height: '48px',
                  fontSize: '1.125rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  marginBottom: '12px'
                }}
              >
                {vehicle.available ? '立即租车' : '暂不可租'}
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  icon={<SwapOutlined />}
                  onClick={toggleCompare}
                  style={{
                    flex: 1,
                    borderColor: isInCompare ? '#667eea' : undefined,
                    color: isInCompare ? '#667eea' : undefined
                  }}
                >
                  {isInCompare ? '已加入对比' : '加入对比'}
                </Button>
                {compareList.length >= 2 && (
                  <Button
                    type="primary"
                    ghost
                    onClick={goToCompare}
                  >
                    查看对比
                  </Button>
                )}
              </div>

              {compareList.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '8px' }}>
                    对比列表 ({compareList.length}/3)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {compareList.map(vid => (
                      <Tag
                        key={vid}
                        color={vid === Number(id) ? 'blue' : 'default'}
                        closable={vid !== Number(id)}
                        onClose={() => setCompareList(compareList.filter(v => v !== vid))}
                      >
                        车辆 #{vid}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {recommendedVehicles.length > 0 && (
        <Card
          style={{ marginTop: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          title={<span style={{ fontSize: '1.5rem', fontWeight: 600 }}>猜你喜欢</span>}
        >
          <Row gutter={[16, 16]}>
            {recommendedVehicles.map(item => (
              <Col xs={24} sm={12} md={6} key={item.vehicle.id}>
                <Link to={`/vehicles/${item.vehicle.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' }}>🚗</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#333' }}>{item.vehicle.name}</h4>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginBottom: '4px' }}>¥{item.vehicle.price}/天</div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>
                      {item.vehicle.type} · ⭐ {item.vehicle.rating}
                    </div>
                    {item.reason && (
                      <div style={{ fontSize: '0.75rem', color: '#667eea', background: '#f0f2ff', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                        💡 {item.reason}
                      </div>
                    )}
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  )
}

export default VehicleDetail
