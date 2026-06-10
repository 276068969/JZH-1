import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Button, Modal, message, Tabs, Descriptions, Radio, DatePicker, Alert, Divider } from 'antd'
import {
  EnvironmentOutlined,
  CalendarOutlined,
  CarOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import OrderTimeline, { OrderItem } from '../components/OrderTimeline'

interface Order {
  id: number
  vehicleId: number
  vehicleName: string
  vehicleType: string
  vehicleLocation: string
  vehiclePrice: number
  vehicleRating: number
  vehicleDescription: string
  startDate: string
  endDate: string
  totalPrice: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  renewCount?: number
  createTime: string
}

interface RenewCheckResult {
  available: boolean
  currentEndDate: string
  newEndDate: string
  additionalDays: number
  dailyPrice: number
  additionalPrice: number
  originalTotalPrice: number
  newTotalPrice: number
}

const Orders: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline')
  const [renewModalVisible, setRenewModalVisible] = useState(false)
  const [renewOrder, setRenewOrder] = useState<Order | null>(null)
  const [renewEndDate, setRenewEndDate] = useState<Dayjs | null>(null)
  const [renewCheckResult, setRenewCheckResult] = useState<RenewCheckResult | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [confirmingRenew, setConfirmingRenew] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    setOrdersError(null)
    try {
      const response = await axios.get('/api/orders')
      if (response.data?.code === 401) {
        setOrdersError('登录已过期，请重新登录')
        return
      }
      const data = response.data?.data || response.data
      if (Array.isArray(data)) {
        const mappedOrders = data.map((item: any) => ({
          id: item.id,
          vehicleId: item.vehicleId,
          vehicleName: item.vehicleName || `车辆 #${item.vehicleId}`,
          vehicleType: item.vehicleType || '轿车',
          vehicleLocation: item.vehicleLocation || '北京市',
          vehiclePrice: item.vehiclePrice || 0,
          vehicleRating: item.vehicleRating || 4.5,
          vehicleDescription: item.vehicleDescription || '',
          startDate: item.startDate,
          endDate: item.endDate,
          totalPrice: item.totalPrice,
          status: item.status,
          renewCount: item.renewCount || 0,
          createTime: item.createTime
        }))
        setOrders(mappedOrders)
      } else {
        setOrdersError('暂无订单数据')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setOrdersError('登录已过期，请重新登录')
      } else {
        setOrdersError(error.response?.data?.message || '加载订单失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (orderId: number) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '确定要取消这个订单吗？',
      onOk: async () => {
        try {
          await axios.delete(`/api/orders/${orderId}`)
          message.success('订单已取消')
          loadOrders()
        } catch (error: any) {
          message.error(error.response?.data?.message || '取消订单失败')
        }
      }
    })
  }

  const handleRenew = (order: Order) => {
    setRenewOrder(order)
    setRenewEndDate(null)
    setRenewCheckResult(null)
    setRenewModalVisible(true)
  }

  const handleRenewDateChange = async (date: Dayjs | null) => {
    setRenewEndDate(date)
    setRenewCheckResult(null)

    if (!date || !renewOrder) return

    const endDate = dayjs(renewOrder.endDate)
    if (!date.isAfter(endDate, 'day')) {
      message.warning('续租结束日期必须晚于当前还车日期')
      return
    }

    setCheckingAvailability(true)
    try {
      const response = await axios.post(`/api/orders/${renewOrder.id}/renew/check`, {
        newEndDate: date.format('YYYY-MM-DD')
      })
      if (response.data?.code === 200) {
        setRenewCheckResult(response.data.data)
      } else {
        message.error(response.data?.message || '查询失败')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '查询档期失败')
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleConfirmRenew = async () => {
    if (!renewOrder || !renewEndDate || !renewCheckResult?.available) return

    setConfirmingRenew(true)
    try {
      const response = await axios.post(`/api/orders/${renewOrder.id}/renew`, {
        newEndDate: renewEndDate.format('YYYY-MM-DD')
      })
      if (response.data?.code === 200) {
        message.success('续租成功！')
        setRenewModalVisible(false)
        loadOrders()
      } else {
        message.error(response.data?.message || '续租失败')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '续租失败')
    } finally {
      setConfirmingRenew(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      active: 'green',
      completed: 'blue',
      cancelled: 'red'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待取车',
      active: '使用中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return dateStr.split('T')[0]
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id.toString().padStart(6, '0')}`
    },
    {
      title: '车辆',
      key: 'vehicle',
      render: (_: any, record: Order) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CarOutlined style={{ color: '#667eea' }} />
            <span style={{ fontWeight: '500' }}>{record.vehicleName}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
            {record.vehicleType}
          </div>
        </div>
      )
    },
    {
      title: '租期',
      key: 'period',
      render: (_: any, record: Order) => (
        <span>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          {formatDate(record.startDate)} 至 {formatDate(record.endDate)}
        </span>
      )
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{price}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            type="link"
            onClick={() => setSelectedOrder(record)}
          >
            详情
          </Button>
          {(record.status === 'pending' || record.status === 'active') && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handleRenew(record)}
            >
              续租
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancel(record.id)}
            >
              取消
            </Button>
          )}
        </div>
      )
    }
  ]

  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'pending')
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled')

  const timelineOrders: OrderItem[] = orders.map(o => ({
    id: o.id,
    vehicleId: o.vehicleId,
    vehicleName: o.vehicleName,
    vehicleType: o.vehicleType,
    vehicleLocation: o.vehicleLocation,
    vehiclePrice: o.vehiclePrice,
    vehicleRating: o.vehicleRating,
    vehicleDescription: o.vehicleDescription,
    startDate: o.startDate,
    endDate: o.endDate,
    totalPrice: o.totalPrice,
    status: o.status,
    renewCount: o.renewCount,
    createTime: o.createTime
  }))

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCartOutlined style={{ color: '#667eea', fontSize: '1.25rem' }} />
              <span>我的订单</span>
            </div>
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
              style={{ marginRight: '16px' }}
            >
              <Radio.Button value="timeline">
                <AppstoreOutlined /> 行程看板
              </Radio.Button>
              <Radio.Button value="table">
                <UnorderedListOutlined /> 列表视图
              </Radio.Button>
            </Radio.Group>
          </div>
        }
        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        bodyStyle={{ padding: '24px' }}
      >
        {ordersError ? (
          <Alert
            message={ordersError}
            description={ordersError.includes('登录') ? '请重新登录后查看订单' : '请检查网络连接后重试'}
            type={ordersError.includes('登录') ? 'warning' : 'error'}
            showIcon
            action={
              ordersError.includes('登录') ? (
                <Button size="small" type="primary" onClick={() => navigate('/login')}>
                  去登录
                </Button>
              ) : (
                <Button size="small" onClick={loadOrders}>
                  重试
                </Button>
              )
            }
          />
        ) : viewMode === 'timeline' ? (
          <OrderTimeline
            orders={timelineOrders}
            loading={loading}
            onViewDetail={(order) => {
              const fullOrder = orders.find(o => o.id === order.id)
              if (fullOrder) setSelectedOrder(fullOrder)
            }}
            onCancel={handleCancel}
            onRenew={handleRenew}
          />
        ) : (
          <Tabs
            defaultActiveKey="active"
            items={[
              {
                key: 'active',
                label: `进行中 (${activeOrders.length})`,
                children: (
                  <Table
                    columns={columns}
                    dataSource={activeOrders}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                  />
                )
              },
              {
                key: 'completed',
                label: `历史订单 (${completedOrders.length})`,
                children: (
                  <Table
                    columns={columns}
                    dataSource={completedOrders}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                )
              }
            ]}
          />
        )}
      </Card>

      <Modal
        title="订单详情"
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedOrder(null)}>
            关闭
          </Button>
        ]}
        width={520}
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                padding: '20px',
                color: 'white',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CarOutlined style={{ fontSize: '1.5rem' }} />
                <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>{selectedOrder.vehicleName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', opacity: 0.9 }}>
                <span>{selectedOrder.vehicleType}</span>
                <span>•</span>
                <span><StarOutlined /> {selectedOrder.vehicleRating}</span>
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="订单号">
                #{selectedOrder.id.toString().padStart(6, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="取车日期">
                <CalendarOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {formatDate(selectedOrder.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="还车日期">
                <CalendarOutlined style={{ marginRight: '6px', color: '#764ba2' }} />
                {formatDate(selectedOrder.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="取车地点">
                <EnvironmentOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {selectedOrder.vehicleLocation}
              </Descriptions.Item>
              <Descriptions.Item label="订单总价">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '1.125rem' }}>
                  ¥{selectedOrder.totalPrice}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {getStatusText(selectedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车辆描述">
                {selectedOrder.vehicleDescription || '暂无描述'}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {selectedOrder.createTime}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReloadOutlined style={{ color: '#667eea' }} />
            <span>订单续租</span>
          </div>
        }
        open={renewModalVisible}
        onCancel={() => setRenewModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRenewModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={confirmingRenew}
            disabled={!renewCheckResult?.available}
            onClick={handleConfirmRenew}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
          >
            确认续租
          </Button>
        ]}
        width={520}
      >
        {renewOrder && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                padding: '16px',
                color: 'white',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CarOutlined />
                <span style={{ fontWeight: '600' }}>{renewOrder.vehicleName}</span>
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                {renewOrder.vehicleType} · {renewOrder.vehicleLocation}
              </div>
            </div>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="当前还车日期">
                <CalendarOutlined style={{ marginRight: '6px', color: '#764ba2' }} />
                {formatDate(renewOrder.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="日租金">
                <span style={{ color: '#ff4d4f', fontWeight: '500' }}>¥{renewOrder.vehiclePrice}/天</span>
              </Descriptions.Item>
              <Descriptions.Item label="当前订单总价">
                ¥{renewOrder.totalPrice}
                {renewOrder.renewCount && renewOrder.renewCount > 0 && (
                  <Tag color="purple" style={{ marginLeft: '8px' }}>
                    已续租{renewOrder.renewCount}次
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                <CalendarOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                选择新的还车日期
              </div>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择续租结束日期"
                value={renewEndDate}
                onChange={handleRenewDateChange}
                disabledDate={(current) => {
                  if (!renewOrder) return true
                  return current && current < dayjs(renewOrder.endDate).endOf('day')
                }}
                size="large"
              />
            </div>

            {checkingAvailability && (
              <Alert
                message="正在检查车辆档期..."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            {renewCheckResult && !checkingAvailability && (
              <div>
                <Divider style={{ margin: '12px 0' }} />

                {renewCheckResult.available ? (
                  <Alert
                    message="车辆档期可用，可以续租"
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    style={{ marginBottom: '16px' }}
                  />
                ) : (
                  <Alert
                    message="抱歉，续租时段车辆已被预订"
                    type="error"
                    showIcon
                    icon={<CloseCircleOutlined />}
                    style={{ marginBottom: '16px' }}
                  />
                )}

                <Descriptions column={1} size="small">
                  <Descriptions.Item label="续租天数">
                    <span style={{ color: '#667eea', fontWeight: '500' }}>
                      {renewCheckResult.additionalDays} 天
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="续租费用">
                    <span style={{ color: '#667eea' }}>
                      ¥{renewCheckResult.dailyPrice} × {renewCheckResult.additionalDays}天 = 
                      <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>
                        ¥{renewCheckResult.additionalPrice}
                      </span>
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="续租后总价">
                    <span style={{ color: '#ff4d4f', fontSize: '1.125rem', fontWeight: 'bold' }}>
                      ¥{renewCheckResult.newTotalPrice}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders
