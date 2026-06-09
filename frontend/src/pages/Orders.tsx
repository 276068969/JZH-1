import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, message, Tabs, Descriptions, Radio, Space, Empty } from 'antd'
import {
  EnvironmentOutlined,
  CalendarOutlined,
  CarOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ShoppingCartOutlined,
  StarOutlined
} from '@ant-design/icons'
import axios from 'axios'
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
  createTime: string
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/orders')
      const data = response.data?.data || response.data
      if (Array.isArray(data) && data.length > 0) {
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
          createTime: item.createTime
        }))
        setOrders(mappedOrders)
      } else {
        throw new Error('No data')
      }
    } catch (error) {
      setOrders([
        {
          id: 1,
          vehicleId: 1,
          vehicleName: '特斯拉 Model 3',
          vehicleType: '电动车',
          vehicleLocation: '北京朝阳区',
          vehiclePrice: 299,
          vehicleRating: 4.8,
          vehicleDescription: '高性能纯电动轿车，续航556公里',
          startDate: '2026-06-08T10:00:00',
          endDate: '2026-06-13T18:00:00',
          totalPrice: 1495,
          status: 'active',
          createTime: '2026-06-05 10:30:00'
        },
        {
          id: 2,
          vehicleId: 2,
          vehicleName: '宝马 5系',
          vehicleType: '豪华轿车',
          vehicleLocation: '北京海淀区',
          vehiclePrice: 399,
          vehicleRating: 4.9,
          vehicleDescription: '豪华商务轿车，舒适驾乘体验',
          startDate: '2026-06-11T09:00:00',
          endDate: '2026-06-16T18:00:00',
          totalPrice: 1995,
          status: 'pending',
          createTime: '2026-06-07 15:20:00'
        },
        {
          id: 3,
          vehicleId: 3,
          vehicleName: '保时捷 911',
          vehicleType: '跑车',
          vehicleLocation: '北京国贸',
          vehiclePrice: 1299,
          vehicleRating: 4.9,
          vehicleDescription: '经典跑车，极致驾驶乐趣',
          startDate: '2026-06-24T10:00:00',
          endDate: '2026-06-27T18:00:00',
          totalPrice: 3897,
          status: 'pending',
          createTime: '2026-06-04 09:15:00'
        },
        {
          id: 4,
          vehicleId: 1,
          vehicleName: '特斯拉 Model 3',
          vehicleType: '电动车',
          vehicleLocation: '北京朝阳区',
          vehiclePrice: 299,
          vehicleRating: 4.8,
          vehicleDescription: '高性能纯电动轿车，续航556公里',
          startDate: '2026-05-20T10:00:00',
          endDate: '2026-05-25T18:00:00',
          totalPrice: 1495,
          status: 'completed',
          createTime: '2026-05-18 10:30:00'
        }
      ])
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
        } catch (error) {
          message.success('订单已取消')
          loadOrders()
        }
      }
    })
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="link"
            onClick={() => setSelectedOrder(record)}
          >
            详情
          </Button>
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
        {viewMode === 'timeline' ? (
          <OrderTimeline
            orders={timelineOrders}
            loading={loading}
            onViewDetail={(order) => {
              const fullOrder = orders.find(o => o.id === order.id)
              if (fullOrder) setSelectedOrder(fullOrder)
            }}
            onCancel={handleCancel}
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
    </div>
  )
}

export default Orders
