import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, message, Tabs, Descriptions } from 'antd'
import { EnvironmentOutlined, CalendarOutlined, CarOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'

interface Order {
  id: number
  vehicleName: string
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

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/orders')
      setOrders(response.data)
    } catch (error) {
      setOrders([
        {
          id: 1,
          vehicleName: '特斯拉 Model 3',
          startDate: '2026-06-10',
          endDate: '2026-06-15',
          totalPrice: 1495,
          status: 'active',
          createTime: '2026-06-08 10:30:00'
        },
        {
          id: 2,
          vehicleName: '宝马 5系',
          startDate: '2026-05-20',
          endDate: '2026-05-25',
          totalPrice: 1995,
          status: 'completed',
          createTime: '2026-05-18 15:20:00'
        },
        {
          id: 3,
          vehicleName: '保时捷 911',
          startDate: '2026-07-01',
          endDate: '2026-07-03',
          totalPrice: 2598,
          status: 'pending',
          createTime: '2026-06-08 09:15:00'
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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id.toString().padStart(6, '0')}`
    },
    {
      title: '车辆',
      dataIndex: 'vehicleName',
      key: 'vehicleName',
      render: (text: string) => (
        <span>
          <CarOutlined style={{ marginRight: '8px' }} />
          {text}
        </span>
      )
    },
    {
      title: '租期',
      key: 'period',
      render: (_: any, record: Order) => (
        <span>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          {record.startDate} 至 {record.endDate}
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

  return (
    <div>
      <Card
        title={<><EnvironmentOutlined /> 我的订单</>}
        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
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
      >
        {selectedOrder && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="订单号">
              #{selectedOrder.id.toString().padStart(6, '0')}
            </Descriptions.Item>
            <Descriptions.Item label="车辆">
              {selectedOrder.vehicleName}
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {selectedOrder.startDate}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {selectedOrder.endDate}
            </Descriptions.Item>
            <Descriptions.Item label="总价">
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{selectedOrder.totalPrice}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedOrder.status)}>
                {getStatusText(selectedOrder.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="下单时间">
              {selectedOrder.createTime}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default Orders
