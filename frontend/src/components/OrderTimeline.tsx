import React from 'react'
import { Card, Tag, Button, Empty, Badge } from 'antd'
import {
  CarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  RepeatOutlined
} from '@ant-design/icons'

export interface OrderItem {
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

interface OrderTimelineProps {
  orders: OrderItem[]
  loading?: boolean
  onViewDetail?: (order: OrderItem) => void
  onCancel?: (orderId: number) => void
  onRenew?: (order: OrderItem) => void
  onReRent?: (order: OrderItem) => void
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; text: string; bgColor: string; borderColor: string }> = {
    pending: {
      color: '#fa8c16',
      text: '待取车',
      bgColor: '#fff7e6',
      borderColor: '#ffd591'
    },
    active: {
      color: '#52c41a',
      text: '使用中',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    completed: {
      color: '#1890ff',
      text: '已完成',
      bgColor: '#e6f7ff',
      borderColor: '#91d5ff'
    },
    cancelled: {
      color: '#ff4d4f',
      text: '已取消',
      bgColor: '#fff1f0',
      borderColor: '#ffa39e'
    }
  }
  return configs[status] || configs.pending
}

const formatDate = (dateStr: string) => {
  if (!dateStr) {
    return {
      date: '',
      weekday: '',
      fullDate: ''
    }
  }
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return {
    date: `${month}月${day}日`,
    weekday: weekdays[date.getDay()],
    fullDate: dateStr.split('T')[0]
  }
}

const getDaysDiff = (startStr: string, endStr: string) => {
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

const getDaysUntilStart = (startStr: string) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(startStr)
  start.setHours(0, 0, 0, 0)
  const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

const groupOrders = (orders: OrderItem[]) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const upcoming: OrderItem[] = []
  const active: OrderItem[] = []
  const completed: OrderItem[] = []

  orders.forEach(order => {
    const startDate = new Date(order.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(order.endDate)
    endDate.setHours(0, 0, 0, 0)

    if (order.status === 'cancelled') {
      completed.push(order)
    } else if (order.status === 'completed') {
      completed.push(order)
    } else if (now >= startDate && now <= endDate) {
      active.push(order)
    } else if (now < startDate) {
      upcoming.push(order)
    } else {
      completed.push(order)
    }
  })

  const sortByStartDate = (a: OrderItem, b: OrderItem) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()

  upcoming.sort(sortByStartDate)
  active.sort(sortByStartDate)
  completed.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  return { upcoming, active, completed }
}

const OrderCard: React.FC<{
  order: OrderItem
  onViewDetail?: (order: OrderItem) => void
  onCancel?: (orderId: number) => void
  onRenew?: (order: OrderItem) => void
  onReRent?: (order: OrderItem) => void
}> = ({ order, onViewDetail, onCancel, onRenew, onReRent }) => {
  const statusConfig = getStatusConfig(order.status)
  const startInfo = formatDate(order.startDate)
  const endInfo = formatDate(order.endDate)
  const days = getDaysDiff(order.startDate, order.endDate)
  const daysUntil = getDaysUntilStart(order.startDate)

  return (
    <Card
      hoverable
      onClick={() => onViewDetail?.(order)}
      style={{
        borderRadius: '12px',
        borderLeft: `4px solid ${statusConfig.color}`,
        marginBottom: '16px',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CarOutlined style={{ fontSize: '1.25rem', color: '#667eea' }} />
            <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#333' }}>
              {order.vehicleName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', fontSize: '0.875rem' }}>
            <Tag color="blue" style={{ margin: 0 }}>{order.vehicleType}</Tag>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>{order.vehicleRating}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Tag
            color={statusConfig.color}
            style={{
              margin: 0,
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            {statusConfig.text}
          </Tag>
          {order.status === 'pending' && daysUntil > 0 && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#fa8c16' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {daysUntil}天后取车
            </div>
          )}
          {order.status === 'active' && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#52c41a' }}>
              <Badge status="processing" color="#52c41a" text="进行中" />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #f0f5ff 0%, #f9f0ff 100%)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>
              {startInfo.date}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>{startInfo.weekday}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>取车</div>
          </div>
          <div style={{ flex: '0 0 auto', padding: '0 12px' }}>
            <div
              style={{
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                position: 'relative',
                minWidth: '60px'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'white',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  color: '#667eea',
                  fontWeight: '500',
                  borderRadius: '10px',
                  border: '1px solid #667eea',
                  whiteSpace: 'nowrap'
                }}
              >
                {days}天
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#764ba2', marginBottom: '4px' }}>
              {endInfo.date}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>{endInfo.weekday}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>还车</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666', fontSize: '0.875rem' }}>
          <EnvironmentOutlined style={{ color: '#667eea' }} />
          <span>{order.vehicleLocation}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ff4d4f' }}>
              ¥{order.totalPrice}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>
              共{days}天
              {order.renewCount && order.renewCount > 0 && (
                <span style={{ marginLeft: '8px', color: '#667eea' }}>
                  已续租{order.renewCount}次
                </span>
              )}
            </div>
          </div>
          {(order.status === 'pending' || order.status === 'active') && onRenew && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              style={{ color: '#667eea' }}
              onClick={(e) => {
                e.stopPropagation()
                onRenew(order)
              }}
            >
              续租
            </Button>
          )}
          {order.status === 'completed' && onReRent && (
            <Button
              type="text"
              size="small"
              icon={<RepeatOutlined />}
              style={{ color: '#52c41a' }}
              onClick={(e) => {
                e.stopPropagation()
                onReRent(order)
              }}
            >
              复租
            </Button>
          )}
          {order.status === 'pending' && onCancel && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onCancel(order.id)
              }}
            >
              取消
            </Button>
          )}
        </div>
      </div>

      {order.vehicleDescription && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px dashed #f0f0f0',
          fontSize: '0.8125rem',
          color: '#999'
        }}>
          <InfoCircleOutlined style={{ marginRight: '6px' }} />
          {order.vehicleDescription}
        </div>
      )}
    </Card>
  )
}

const SectionHeader: React.FC<{
  title: string
  count: number
  icon: React.ReactNode
  color: string
}> = ({ title, count, icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        fontSize: '1.25rem'
      }}
    >
      {icon}
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#333' }}>{title}</h3>
      <span style={{ fontSize: '0.8125rem', color: '#999' }}>共 {count} 个订单</span>
    </div>
  </div>
)

const OrderTimeline: React.FC<OrderTimelineProps> = ({ orders, loading, onViewDetail, onCancel, onRenew, onReRent }) => {
  const { upcoming, active, completed } = groupOrders(orders)

  return (
    <div>
      {active.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <SectionHeader
            title="当前进行中"
            count={active.length}
            icon={<CarOutlined />}
            color="#52c41a"
          />
          {active.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetail={onViewDetail}
              onCancel={onCancel}
              onRenew={onRenew}
              onReRent={onReRent}
            />
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <SectionHeader
            title="未来待取车"
            count={upcoming.length}
            icon={<CalendarOutlined />}
            color="#fa8c16"
          />
          {upcoming.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetail={onViewDetail}
              onCancel={onCancel}
              onRenew={onRenew}
              onReRent={onReRent}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <SectionHeader
            title="已完成订单"
            count={completed.length}
            icon={<ClockCircleOutlined />}
            color="#1890ff"
          />
          {completed.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetail={onViewDetail}
              onCancel={onCancel}
              onRenew={onRenew}
              onReRent={onReRent}
            />
          ))}
        </div>
      )}

      {orders.length === 0 && !loading && (
        <Empty
          description="暂无订单"
          style={{ padding: '60px 0' }}
        />
      )}
    </div>
  )
}

export default OrderTimeline
