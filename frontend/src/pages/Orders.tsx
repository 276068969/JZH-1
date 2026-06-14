import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Table, Tag, Button, Modal, message, Tabs, Descriptions, Radio, DatePicker, Alert, Divider, Row, Col, Empty, Badge, Steps, Input, InputNumber, Form } from 'antd'
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
  CloseCircleOutlined,
  ShopOutlined,
  FileTextOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  RetweetOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined
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
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'picked_up' | 'returned'
  renewCount?: number
  createTime: string
  pickupTime?: string
  pickupNote?: string
  pickupOdometer?: number
  returnTime?: string
  returnNote?: string
  returnOdometer?: number
}

interface EnterpriseApplication {
  id: number
  userId: number
  plannedStartDate: string
  plannedEndDate: string
  vehiclePreference: string
  estimatedQuantity: number
  contactName: string
  contactPhone: string
  contactEmail: string
  businessPurpose: string
  specialRequirements: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  reviewComment: string
  createTime: string
  updateTime: string
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

interface OrdersProps {
  isEnterpriseUser?: boolean
}

const Orders: React.FC<OrdersProps> = ({ isEnterpriseUser = false }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const locationState = location.state as { activeKey?: string } | null
  const initialActiveKey = locationState?.activeKey === 'enterprise' && isEnterpriseUser ? 'enterprise' : 'personal'

  const [mainTabKey, setMainTabKey] = useState<string>(initialActiveKey)

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline')
  const [renewModalVisible, setRenewModalVisible] = useState(false)
  const [renewOrder, setRenewOrder] = useState<Order | null>(null)
  const [renewEndDate, setRenewEndDate] = useState<Dayjs | null>(null)
  const [renewCheckResult, setRenewCheckResult] = useState<RenewCheckResult | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [confirmingRenew, setConfirmingRenew] = useState(false)

  const [reRentModalVisible, setReRentModalVisible] = useState(false)
  const [reRentOrder, setReRentOrder] = useState<Order | null>(null)
  const [reRentDays, setReRentDays] = useState<number>(0)
  const [reRentStartDate, setReRentStartDate] = useState<Dayjs | null>(null)
  const [reRentEndDate, setReRentEndDate] = useState<Dayjs | null>(null)
  const [checkingReRentAvailability, setCheckingReRentAvailability] = useState(false)
  const [reRentAvailable, setReRentAvailable] = useState<boolean | null>(null)

  const [pickupModalVisible, setPickupModalVisible] = useState(false)
  const [pickupOrder, setPickupOrder] = useState<Order | null>(null)
  const [pickupNote, setPickupNote] = useState('')
  const [pickupOdometer, setPickupOdometer] = useState<string>('')
  const [confirmingPickup, setConfirmingPickup] = useState(false)

  const [returnModalVisible, setReturnModalVisible] = useState(false)
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)
  const [returnNote, setReturnNote] = useState('')
  const [returnOdometer, setReturnOdometer] = useState<string>('')
  const [confirmingReturn, setConfirmingReturn] = useState(false)

  const [applications, setApplications] = useState<EnterpriseApplication[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<EnterpriseApplication | null>(null)

  useEffect(() => {
    if (mainTabKey === 'personal') {
      loadOrders()
    } else if (mainTabKey === 'enterprise') {
      loadApplications()
    }
  }, [mainTabKey])

  const loadOrders = async () => {
    setLoadingOrders(true)
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
          createTime: item.createTime,
          pickupTime: item.pickupTime,
          pickupNote: item.pickupNote,
          pickupOdometer: item.pickupOdometer,
          returnTime: item.returnTime,
          returnNote: item.returnNote,
          returnOdometer: item.returnOdometer
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
      setLoadingOrders(false)
    }
  }

  const loadApplications = async () => {
    setLoadingApplications(true)
    setApplicationsError(null)
    try {
      const response = await axios.get('/api/enterprise-rental/applications')
      if (response.data?.code === 401) {
        setApplicationsError('登录已过期，请重新登录')
        return
      }
      if (response.data?.code === 403) {
        setApplicationsError(response.data?.message || '无权限访问')
        return
      }
      const data = response.data?.data
      if (Array.isArray(data)) {
        setApplications(data)
      } else {
        setApplications([])
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setApplicationsError('登录已过期，请重新登录')
      } else if (error.response?.status === 403) {
        setApplicationsError(error.response?.data?.message || '无权限访问')
      } else {
        setApplicationsError(error.response?.data?.message || '加载申请记录失败，请稍后重试')
      }
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleCancel = async (orderId: number) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '确定要取消这个订单吗？取消后车辆将恢复可租状态。',
      onOk: async () => {
        try {
          const response = await axios.delete(`/api/orders/${orderId}`)
          if (response.data?.code === 200) {
            message.success('订单已取消，车辆已恢复可租')
            loadOrders()
          } else if (response.data?.code === 401) {
            message.error('登录已过期，请重新登录')
          } else {
            message.error(response.data?.message || '取消订单失败')
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '取消订单失败，请稍后重试')
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

  const handleReRent = (order: Order) => {
    const start = dayjs(order.startDate)
    const end = dayjs(order.endDate)
    const days = end.diff(start, 'day') + 1
    const defaultStart = dayjs().add(1, 'day')
    const defaultEnd = defaultStart.add(days - 1, 'day')

    setReRentOrder(order)
    setReRentDays(days)
    setReRentStartDate(defaultStart)
    setReRentEndDate(defaultEnd)
    setReRentAvailable(null)
    setReRentModalVisible(true)

    checkReRentAvailability(order.vehicleId)
  }

  const checkReRentAvailability = async (vehicleId: number) => {
    setCheckingReRentAvailability(true)
    setReRentAvailable(null)
    try {
      const response = await axios.get(`/api/vehicles/${vehicleId}`)
      const vehicle = response.data?.data || response.data
      if (vehicle && vehicle.available) {
        setReRentAvailable(true)
      } else {
        setReRentAvailable(false)
      }
    } catch (error: any) {
      setReRentAvailable(false)
      message.error(error.response?.data?.message || '查询车辆状态失败')
    } finally {
      setCheckingReRentAvailability(false)
    }
  }

  const handleReRentStartDateChange = (date: Dayjs | null) => {
    if (!date) return
    setReRentStartDate(date)
    if (reRentDays > 0) {
      const newEnd = date.add(reRentDays - 1, 'day')
      setReRentEndDate(newEnd)
      if (reRentOrder) {
        checkReRentAvailability(reRentOrder.vehicleId)
      }
    }
  }

  const handleReRentDaysChange = (days: number) => {
    setReRentDays(days)
    if (reRentStartDate) {
      const newEnd = reRentStartDate.add(days - 1, 'day')
      setReRentEndDate(newEnd)
      if (reRentOrder) {
        checkReRentAvailability(reRentOrder.vehicleId)
      }
    }
  }

  const handleConfirmReRent = () => {
    if (!reRentOrder || !reRentStartDate || !reRentEndDate || !reRentAvailable) {
      message.warning('请选择有效的租车时间')
      return
    }

    navigate(`/vehicles/${reRentOrder.vehicleId}`, {
      state: {
        fromReRent: true,
        orderId: reRentOrder.id,
        startDate: reRentStartDate.format('YYYY-MM-DD'),
        endDate: reRentEndDate.format('YYYY-MM-DD'),
        days: reRentDays,
        originalOrder: {
          id: reRentOrder.id,
          vehicleName: reRentOrder.vehicleName,
          totalPrice: reRentOrder.totalPrice
        }
      }
    })
  }

  const calculateReRentPrice = () => {
    if (!reRentOrder || reRentDays <= 0) return 0
    return reRentOrder.vehiclePrice * reRentDays
  }

  const handlePickup = (order: Order) => {
    setPickupOrder(order)
    setPickupNote('')
    setPickupOdometer('')
    setPickupModalVisible(true)
  }

  const handleConfirmPickup = async () => {
    if (!pickupOrder) return

    setConfirmingPickup(true)
    try {
      const params: any = {}
      if (pickupNote.trim()) {
        params.pickupNote = pickupNote.trim()
      }
      if (pickupOdometer.trim() && !isNaN(parseFloat(pickupOdometer))) {
        params.pickupOdometer = parseFloat(pickupOdometer)
      }

      const response = await axios.post(`/api/orders/${pickupOrder.id}/pickup`,
        Object.keys(params).length > 0 ? params : undefined
      )

      if (response.data?.code === 200) {
        message.success('取车确认成功！祝您用车愉快')
        setPickupModalVisible(false)
        loadOrders()
      } else if (response.data?.code === 401) {
        message.error('登录已过期，请重新登录')
      } else {
        message.error(response.data?.message || '取车确认失败')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '取车确认失败，请稍后重试')
    } finally {
      setConfirmingPickup(false)
    }
  }

  const handleReturn = (order: Order) => {
    setReturnOrder(order)
    setReturnNote('')
    setReturnOdometer('')
    setReturnModalVisible(true)
  }

  const handleConfirmReturn = async () => {
    if (!returnOrder) return

    setConfirmingReturn(true)
    try {
      const params: any = {}
      if (returnNote.trim()) {
        params.returnNote = returnNote.trim()
      }
      if (returnOdometer.trim() && !isNaN(parseFloat(returnOdometer))) {
        params.returnOdometer = parseFloat(returnOdometer)
      }

      const response = await axios.post(`/api/orders/${returnOrder.id}/return`,
        Object.keys(params).length > 0 ? params : undefined
      )

      if (response.data?.code === 200) {
        message.success('还车确认成功！感谢您的使用')
        setReturnModalVisible(false)
        loadOrders()
      } else if (response.data?.code === 401) {
        message.error('登录已过期，请重新登录')
      } else {
        message.error(response.data?.message || '还车确认失败')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '还车确认失败，请稍后重试')
    } finally {
      setConfirmingReturn(false)
    }
  }

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      active: 'green',
      picked_up: 'cyan',
      returned: 'purple',
      completed: 'blue',
      cancelled: 'red'
    }
    return colors[status] || 'default'
  }

  const getOrderStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待取车',
      active: '使用中',
      picked_up: '已取车·待还车',
      returned: '已还车',
      completed: '已完成',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  const getApplicationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      completed: 'blue'
    }
    return colors[status] || 'default'
  }

  const getApplicationStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
      completed: '已完成'
    }
    return texts[status] || status
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return dateStr.split('T')[0]
  }

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return ''
    return dateTimeStr.replace('T', ' ').split('.')[0]
  }

  const orderColumns = [
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
        <Tag color={getOrderStatusColor(status)}>{getOrderStatusText(status)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Button
            type="link"
            onClick={() => setSelectedOrder(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<CarOutlined />}
              style={{ color: '#fa8c16', fontWeight: 500 }}
              onClick={() => handlePickup(record)}
            >
              确认取车
            </Button>
          )}
          {record.status === 'picked_up' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              style={{ color: '#13c2c2', fontWeight: 500 }}
              onClick={() => handleReturn(record)}
            >
              确认还车
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'active' || record.status === 'picked_up') && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handleRenew(record)}
            >
              续租
            </Button>
          )}
          {(record.status === 'completed' || record.status === 'returned') && (
            <Button
              type="link"
              icon={<RetweetOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleReRent(record)}
            >
              复租
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

  const applicationColumns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id.toString().padStart(6, '0')}`
    },
    {
      title: '计划用车时间',
      key: 'period',
      render: (_: any, record: EnterpriseApplication) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarOutlined style={{ color: '#667eea' }} />
            <span>{formatDate(record.plannedStartDate)} 至 {formatDate(record.plannedEndDate)}</span>
          </div>
        </div>
      )
    },
    {
      title: '车型偏好',
      dataIndex: 'vehiclePreference',
      key: 'vehiclePreference',
      render: (pref: string) => (
        <div>
          {pref?.split(',').map((p, i) => (
            <Tag key={i} color="purple" style={{ marginBottom: '4px' }}>{p}</Tag>
          ))}
        </div>
      )
    },
    {
      title: '预计数量',
      dataIndex: 'estimatedQuantity',
      key: 'estimatedQuantity',
      render: (qty: number) => `${qty} 辆`
    },
    {
      title: '联系人',
      key: 'contact',
      render: (_: any, record: EnterpriseApplication) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: '#667eea' }} />
            <span>{record.contactName}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
            {record.contactPhone}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={
            status === 'pending' ? 'processing' :
            status === 'approved' ? 'success' :
            status === 'rejected' ? 'error' : 'default'
          }
          text={<Tag color={getApplicationStatusColor(status)}>{getApplicationStatusText(status)}</Tag>}
        />
      )
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: EnterpriseApplication) => (
        <Button
          type="link"
          onClick={() => setSelectedApplication(record)}
        >
          查看详情
        </Button>
      )
    }
  ]

  const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'pending' || o.status === 'picked_up')
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled' || o.status === 'returned')

  const pendingApplications = applications.filter(a => a.status === 'pending')
  const processedApplications = applications.filter(a => a.status !== 'pending')

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
    createTime: o.createTime,
    pickupTime: o.pickupTime,
    pickupNote: o.pickupNote,
    pickupOdometer: o.pickupOdometer,
    returnTime: o.returnTime,
    returnNote: o.returnNote,
    returnOdometer: o.returnOdometer
  }))

  const renderPersonalOrders = () => {
    if (ordersError) {
      return (
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
      )
    }

    if (viewMode === 'timeline') {
      return (
        <OrderTimeline
          orders={timelineOrders}
          loading={loadingOrders}
          onViewDetail={(order) => {
            const fullOrder = orders.find(o => o.id === order.id)
            if (fullOrder) setSelectedOrder(fullOrder)
          }}
          onCancel={handleCancel}
          onRenew={handleRenew}
          onReRent={handleReRent}
          onPickup={(order) => {
            const fullOrder = orders.find(o => o.id === order.id)
            if (fullOrder) handlePickup(fullOrder)
          }}
          onReturn={(order) => {
            const fullOrder = orders.find(o => o.id === order.id)
            if (fullOrder) handleReturn(fullOrder)
          }}
        />
      )
    }

    return (
      <Tabs
        defaultActiveKey="active"
        items={[
          {
            key: 'active',
            label: `进行中 (${activeOrders.length})`,
            children: (
              <Table
                columns={orderColumns}
                dataSource={activeOrders}
                rowKey="id"
                loading={loadingOrders}
                pagination={false}
                locale={{ emptyText: <Empty description="暂无进行中的订单" /> }}
              />
            )
          },
          {
            key: 'completed',
            label: `历史订单 (${completedOrders.length})`,
            children: (
              <Table
                columns={orderColumns}
                dataSource={completedOrders}
                rowKey="id"
                loading={loadingOrders}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: <Empty description="暂无历史订单" /> }}
              />
            )
          }
        ]}
      />
    )
  }

  const renderEnterpriseApplications = () => {
    if (applicationsError) {
      return (
        <Alert
          message={applicationsError}
          description={applicationsError.includes('登录') ? '请重新登录后查看申请记录' : '请检查网络连接后重试'}
          type={applicationsError.includes('登录') || applicationsError.includes('权限') ? 'warning' : 'error'}
          showIcon
          action={
            applicationsError.includes('登录') ? (
              <Button size="small" type="primary" onClick={() => navigate('/login')}>
                去登录
              </Button>
            ) : (
              <Button size="small" onClick={loadApplications}>
                重试
              </Button>
            )
          }
        />
      )
    }

    return (
      <div>
        <Alert
          message="企业长租服务说明"
          description="提交申请后，专属客户经理将在1-3个工作日内与您联系，为您提供定制化用车方案。"
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: '20px', borderRadius: '8px' }}
        />

        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/enterprise-rental/apply')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            提交新申请
          </Button>
        </div>

        <Tabs
          defaultActiveKey="pending"
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  <ClockCircleOutlined /> 审核中 ({pendingApplications.length})
                </span>
              ),
              children: (
                <Table
                  columns={applicationColumns}
                  dataSource={pendingApplications}
                  rowKey="id"
                  loading={loadingApplications}
                  pagination={false}
                  locale={{ emptyText: <Empty description="暂无审核中的申请" /> }}
                />
              )
            },
            {
              key: 'processed',
              label: (
                <span>
                  <CheckCircleOutlined /> 已处理 ({processedApplications.length})
                </span>
              ),
              children: (
                <Table
                  columns={applicationColumns}
                  dataSource={processedApplications}
                  rowKey="id"
                  loading={loadingApplications}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: <Empty description="暂无已处理的申请" /> }}
                />
              )
            }
          ]}
        />
      </div>
    )
  }

  const mainTabItems = isEnterpriseUser
    ? [
        {
          key: 'personal',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingCartOutlined />
              个人租车订单
            </span>
          ),
          children: (
            <div style={{ marginTop: '16px' }}>
              {renderPersonalOrders()}
            </div>
          )
        },
        {
          key: 'enterprise',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShopOutlined />
              企业长租申请
              <Tag color="purple" style={{ marginLeft: '4px' }}>专属</Tag>
            </span>
          ),
          children: (
            <div style={{ marginTop: '16px' }}>
              {renderEnterpriseApplications()}
            </div>
          )
        }
      ]
    : null

  return (
    <div>
      <Card
        title={
          isEnterpriseUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCartOutlined style={{ color: '#667eea', fontSize: '1.25rem' }} />
              <span>我的订单与申请</span>
            </div>
          ) : (
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
          )
        }
        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        bodyStyle={{ padding: '24px' }}
        extra={
          isEnterpriseUser && mainTabKey === 'personal' ? (
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
            >
              <Radio.Button value="timeline">
                <AppstoreOutlined /> 行程看板
              </Radio.Button>
              <Radio.Button value="table">
                <UnorderedListOutlined /> 列表视图
              </Radio.Button>
            </Radio.Group>
          ) : null
        }
      >
        {isEnterpriseUser && mainTabItems ? (
          <Tabs
            activeKey={mainTabKey}
            onChange={setMainTabKey}
            items={mainTabItems}
            size="large"
          />
        ) : (
          renderPersonalOrders()
        )}
      </Card>

      <Modal
        title="订单详情"
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={[
          selectedOrder?.status === 'pending' && (
            <Button
              key="pickup"
              type="primary"
              icon={<CarOutlined />}
              style={{
                background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                border: 'none'
              }}
              onClick={() => {
                handlePickup(selectedOrder)
                setSelectedOrder(null)
              }}
            >
              确认取车
            </Button>
          ),
          selectedOrder?.status === 'picked_up' && (
            <Button
              key="return"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{
                background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
                border: 'none'
              }}
              onClick={() => {
                handleReturn(selectedOrder)
                setSelectedOrder(null)
              }}
            >
              确认还车
            </Button>
          ),
          <Button key="close" onClick={() => setSelectedOrder(null)}>
            关闭
          </Button>
        ].filter(Boolean) as React.ReactNode[]}
        width={600}
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
                <span>•</span>
                <Tag color="white" style={{ margin: 0 }}>
                  {getOrderStatusText(selectedOrder.status)}
                </Tag>
              </div>
            </div>

            <Divider orientation="left" style={{ margin: '12px 0 16px 0', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#667eea', fontWeight: 500 }}>
                <ClockCircleOutlined />
                履约流程
              </span>
            </Divider>

            <Steps
              direction="vertical"
              size="small"
              current={
                selectedOrder.status === 'cancelled' ? 0 :
                selectedOrder.status === 'pending' || selectedOrder.status === 'active' ? 1 :
                selectedOrder.status === 'picked_up' ? 2 :
                3
              }
              status={selectedOrder.status === 'cancelled' ? 'error' : undefined}
              style={{ marginBottom: '20px' }}
              items={[
                {
                  title: '订单已创建',
                  description: formatDateTime(selectedOrder.createTime),
                  status: 'finish'
                },
                {
                  title: '待取车',
                  description: selectedOrder.pickupTime ? (
                    <div>
                      <div>{formatDateTime(selectedOrder.pickupTime)}</div>
                      {selectedOrder.pickupNote && (
                        <div style={{ fontSize: '0.8125rem', color: '#666', marginTop: '4px' }}>
                          <InfoCircleOutlined style={{ marginRight: '4px' }} />
                          备注：{selectedOrder.pickupNote}
                        </div>
                      )}
                      {selectedOrder.pickupOdometer != null && (
                        <div style={{ fontSize: '0.8125rem', color: '#666', marginTop: '2px' }}>
                          取车里程：{selectedOrder.pickupOdometer} km
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>预计取车日期：{formatDate(selectedOrder.startDate)}</span>
                  ),
                  status: selectedOrder.pickupTime ? 'finish' :
                         (selectedOrder.status === 'pending' || selectedOrder.status === 'active') ? 'process' : 'wait'
                },
                {
                  title: '已取车·使用中',
                  description: selectedOrder.returnTime ? (
                    <div>
                      <div>{formatDateTime(selectedOrder.pickupTime || '')}</div>
                    </div>
                  ) : selectedOrder.pickupTime ? (
                    <div>
                      <div>取车时间：{formatDateTime(selectedOrder.pickupTime)}</div>
                      <div style={{ color: '#13c2c2', marginTop: '4px' }}>正在使用中，请按时还车</div>
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>取车确认后进入此阶段</span>
                  ),
                  status: selectedOrder.status === 'picked_up' ? 'process' :
                         selectedOrder.returnTime ? 'finish' : 'wait'
                },
                {
                  title: '已还车·订单完成',
                  description: selectedOrder.returnTime ? (
                    <div>
                      <div>{formatDateTime(selectedOrder.returnTime)}</div>
                      {selectedOrder.returnNote && (
                        <div style={{ fontSize: '0.8125rem', color: '#666', marginTop: '4px' }}>
                          <InfoCircleOutlined style={{ marginRight: '4px' }} />
                          备注：{selectedOrder.returnNote}
                        </div>
                      )}
                      {selectedOrder.returnOdometer != null && (
                        <div style={{ fontSize: '0.8125rem', color: '#666', marginTop: '2px' }}>
                          还车里程：{selectedOrder.returnOdometer} km
                          {selectedOrder.pickupOdometer != null && selectedOrder.returnOdometer > selectedOrder.pickupOdometer && (
                            <span style={{ marginLeft: '8px', color: '#52c41a' }}>
                              （行驶 {(selectedOrder.returnOdometer - selectedOrder.pickupOdometer).toFixed(1)} km）
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>预计还车日期：{formatDate(selectedOrder.endDate)}</span>
                  ),
                  status: selectedOrder.returnTime ? 'finish' : 'wait'
                }
              ]}
            />

            <Divider orientation="left" style={{ margin: '12px 0 16px 0', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#764ba2', fontWeight: 500 }}>
                <FileTextOutlined />
                订单信息
              </span>
            </Divider>

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
                {selectedOrder.renewCount && selectedOrder.renewCount > 0 && (
                  <Tag color="purple" style={{ marginLeft: '8px' }}>已续租 {selectedOrder.renewCount} 次</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getOrderStatusColor(selectedOrder.status)}>
                  {getOrderStatusText(selectedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车辆描述">
                {selectedOrder.vehicleDescription || '暂无描述'}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {formatDateTime(selectedOrder.createTime)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShopOutlined style={{ color: '#667eea' }} />
            <span>企业长租申请详情</span>
          </div>
        }
        open={!!selectedApplication}
        onCancel={() => setSelectedApplication(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedApplication(null)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedApplication && (
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
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '4px' }}>申请编号</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                    #{selectedApplication.id.toString().padStart(6, '0')}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '4px' }}>当前状态</div>
                  <Tag color={getApplicationStatusColor(selectedApplication.status)} style={{ marginTop: '4px' }}>
                    {getApplicationStatusText(selectedApplication.status)}
                  </Tag>
                </Col>
              </Row>
            </div>

            {selectedApplication.reviewComment && (
              <Alert
                message={selectedApplication.status === 'approved' ? '审核通过' : selectedApplication.status === 'rejected' ? '审核拒绝' : '审核意见'}
                description={selectedApplication.reviewComment}
                type={selectedApplication.status === 'approved' ? 'success' : selectedApplication.status === 'rejected' ? 'error' : 'info'}
                showIcon
                style={{ marginBottom: '20px', borderRadius: '8px' }}
              />
            )}

            <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarOutlined style={{ color: '#667eea' }} />
                用车计划
              </span>
            </Divider>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="计划开始日期">
                {formatDate(selectedApplication.plannedStartDate)}
              </Descriptions.Item>
              <Descriptions.Item label="计划结束日期">
                {formatDate(selectedApplication.plannedEndDate)}
              </Descriptions.Item>
              <Descriptions.Item label="车型偏好">
                {selectedApplication.vehiclePreference?.split(',').map((p, i) => (
                  <Tag key={i} color="purple" style={{ marginBottom: '4px' }}>{p}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="预计用车数量">
                {selectedApplication.estimatedQuantity} 辆
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserOutlined style={{ color: '#667eea' }} />
                联系人信息
              </span>
            </Divider>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="联系人姓名">
                <UserOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {selectedApplication.contactName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {selectedApplication.contactPhone}
              </Descriptions.Item>
              <Descriptions.Item label="联系邮箱">
                <MailOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {selectedApplication.contactEmail}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileTextOutlined style={{ color: '#667eea' }} />
                需求详情
              </span>
            </Divider>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="企业用途说明">
                {selectedApplication.businessPurpose || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="特殊要求">
                {selectedApplication.specialRequirements || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="申请时间">
                {formatDateTime(selectedApplication.createTime)}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新">
                {formatDateTime(selectedApplication.updateTime)}
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

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RetweetOutlined style={{ color: '#52c41a' }} />
            <span>历史订单复租向导</span>
          </div>
        }
        open={reRentModalVisible}
        onCancel={() => setReRentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReRentModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={!reRentAvailable || checkingReRentAvailability}
            onClick={handleConfirmReRent}
            style={{ background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', border: 'none' }}
          >
            <ArrowRightOutlined />
            前往车辆详情确认
          </Button>
        ]}
        width={600}
        maskClosable={false}
      >
        {reRentOrder && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid #b7eb8f'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CarOutlined style={{ fontSize: '1.5rem', color: '#52c41a' }} />
                <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>{reRentOrder.vehicleName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: '#666' }}>
                <span>{reRentOrder.vehicleType}</span>
                <span>•</span>
                <span><StarOutlined /> {reRentOrder.vehicleRating}</span>
                <span>•</span>
                <span><EnvironmentOutlined /> {reRentOrder.vehicleLocation}</span>
              </div>
            </div>

            <Alert
              message="已为您自动带入上次的租期偏好"
              description="系统根据您的历史订单，自动填充了同款车辆和相同租期，您可以调整后继续下单。"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '20px', borderRadius: '8px' }}
            />

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="历史订单号">
                #{reRentOrder.id.toString().padStart(6, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="上次租期">
                <CalendarOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
                {formatDate(reRentOrder.startDate)} 至 {formatDate(reRentOrder.endDate)}
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  共 {reRentDays} 天
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="上次订单总价">
                ¥{reRentOrder.totalPrice}
              </Descriptions.Item>
              <Descriptions.Item label="日租金">
                <span style={{ color: '#ff4d4f', fontWeight: '500' }}>¥{reRentOrder.vehiclePrice}/天</span>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '12px 0 16px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarOutlined style={{ color: '#52c41a' }} />
                本次租车计划
              </span>
            </Divider>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                选择取车日期
              </label>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择取车日期"
                value={reRentStartDate}
                onChange={handleReRentStartDateChange}
                disabledDate={(current) => {
                  return current && current < dayjs().endOf('day')
                }}
                size="large"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                选择租期
              </label>
              <Radio.Group
                value={reRentDays}
                onChange={(e) => handleReRentDaysChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[8, 8]}>
                  {[1, 2, 3, 5, 7, 15, 30].map(days => (
                    <Col span={8} key={days}>
                      <Radio.Button value={days} style={{ width: '100%', textAlign: 'center' }}>
                        {days} 天
                        {days === reRentDays && (
                          <Tag color="green" style={{ marginLeft: '4px', fontSize: '0.75rem' }}>
                            上次租期
                          </Tag>
                        )}
                      </Radio.Button>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </div>

            {reRentStartDate && reRentEndDate && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>取车日期</span>
                  <span style={{ fontWeight: '500', color: '#52c41a' }}>
                    {reRentStartDate.format('YYYY-MM-DD')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>还车日期</span>
                  <span style={{ fontWeight: '500', color: '#764ba2' }}>
                    {reRentEndDate.format('YYYY-MM-DD')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>租用天数</span>
                  <span>{reRentDays} 天</span>
                </div>
                <div style={{ borderTop: '1px dashed #e0e0e0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  <span>预估总价</span>
                  <span style={{ color: '#ff4d4f' }}>¥{calculateReRentPrice()}</span>
                </div>
              </div>
            )}

            {checkingReRentAvailability && (
              <Alert
                message="正在检查车辆可用性..."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            {!checkingReRentAvailability && reRentAvailable !== null && (
              reRentAvailable ? (
                <Alert
                  message="车辆状态良好，可立即预订"
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ marginBottom: '16px' }}
                />
              ) : (
                <Alert
                  message="抱歉，该车辆当前不可租用"
                  description="车辆可能已被预订或暂时下线，您可以选择其他车辆或调整租期。"
                  type="error"
                  showIcon
                  icon={<CloseCircleOutlined />}
                  style={{ marginBottom: '16px' }}
                />
              )
            )}

            <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: '4px' }} />
              点击"前往车辆详情确认"后，您可以在车辆详情页最终确认并提交订单
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CarOutlined style={{ color: '#fa8c16' }} />
            <span>取车确认</span>
          </div>
        }
        open={pickupModalVisible}
        onCancel={() => setPickupModalVisible(false)}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setPickupModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={confirmingPickup}
            onClick={handleConfirmPickup}
            style={{
              background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
              border: 'none'
            }}
          >
            <CheckCircleOutlined />
            确认取车
          </Button>
        ]}
        width={520}
      >
        {pickupOrder && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #ffd591'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CarOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: '600' }}>{pickupOrder.vehicleName}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {pickupOrder.vehicleType} · {pickupOrder.vehicleLocation}
              </div>
            </div>

            <Alert
              message="取车前请仔细检查车辆状况"
              description="请绕车检查外观、轮胎、车灯等，确认车内物品和油电情况。如有异常请在备注中说明。"
              type="warning"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: '20px', borderRadius: '8px' }}
            />

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="订单号">
                #{pickupOrder.id.toString().padStart(6, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="取车日期">
                <CalendarOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {formatDate(pickupOrder.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="还车日期">
                <CalendarOutlined style={{ marginRight: '6px', color: '#764ba2' }} />
                {formatDate(pickupOrder.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="取车地点">
                <EnvironmentOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                {pickupOrder.vehicleLocation}
              </Descriptions.Item>
              <Descriptions.Item label="订单总价">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{pickupOrder.totalPrice}</span>
              </Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="当前里程表读数（km，选填）">
                <Input
                  placeholder="请输入取车时车辆里程表显示的公里数"
                  value={pickupOdometer}
                  onChange={(e) => setPickupOdometer(e.target.value)}
                  prefix={<span style={{ color: '#999' }}>km</span>}
                  size="large"
                />
              </Form.Item>
              <Form.Item label="取车备注（选填）">
                <Input.TextArea
                  placeholder="请记录车辆外观、内饰、油量/电量等状况，如有划痕、损伤等请备注说明"
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  rows={4}
                  maxLength={500}
                  showCount
                  size="large"
                />
              </Form.Item>
            </Form>

            <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center', marginTop: '12px' }}>
              <CheckCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
              点击"确认取车"即表示您已检查并认可车辆状况，开始计费
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircleOutlined style={{ color: '#13c2c2' }} />
            <span>还车确认</span>
          </div>
        }
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setReturnModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={confirmingReturn}
            onClick={handleConfirmReturn}
            style={{
              background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
              border: 'none'
            }}
          >
            <CheckCircleOutlined />
            确认还车
          </Button>
        ]}
        width={520}
      >
        {returnOrder && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #87e8de'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CarOutlined style={{ color: '#13c2c2' }} />
                <span style={{ fontWeight: '600' }}>{returnOrder.vehicleName}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {returnOrder.vehicleType} · {returnOrder.vehicleLocation}
              </div>
            </div>

            <Alert
              message="还车前请整理好个人物品"
              description="请确认车内没有遗留物品，车辆已熄火、锁好门窗。感谢您的配合！"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: '20px', borderRadius: '8px' }}
            />

            <Descriptions column={1} bordered size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="订单号">
                #{returnOrder.id.toString().padStart(6, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="取车时间">
                {returnOrder.pickupTime ? formatDateTime(returnOrder.pickupTime) : '—'}
                {returnOrder.pickupOdometer != null && (
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                    取车里程：{returnOrder.pickupOdometer} km
                  </div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="约定还车日期">
                {formatDate(returnOrder.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="订单总价">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{returnOrder.totalPrice}</span>
                {returnOrder.renewCount && returnOrder.renewCount > 0 && (
                  <Tag color="purple" style={{ marginLeft: '8px' }}>已续租 {returnOrder.renewCount} 次</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="当前里程表读数（km，选填）">
                <Input
                  placeholder="请输入还车时车辆里程表显示的公里数"
                  value={returnOdometer}
                  onChange={(e) => setReturnOdometer(e.target.value)}
                  prefix={<span style={{ color: '#999' }}>km</span>}
                  size="large"
                />
                {returnOrder.pickupOdometer != null && returnOdometer.trim() && !isNaN(parseFloat(returnOdometer)) && parseFloat(returnOdometer) > returnOrder.pickupOdometer && (
                  <div style={{ fontSize: '0.75rem', color: '#52c41a', marginTop: '4px' }}>
                    本次行驶里程：{(parseFloat(returnOdometer) - returnOrder.pickupOdometer).toFixed(1)} km
                  </div>
                )}
              </Form.Item>
              <Form.Item label="还车备注（选填）">
                <Input.TextArea
                  placeholder="请记录还车时车辆状况，如油量、电量、新增划痕或损伤等"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  rows={4}
                  maxLength={500}
                  showCount
                  size="large"
                />
              </Form.Item>
            </Form>

            <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center', marginTop: '12px' }}>
              <CheckCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
              点击"确认还车"即表示您已完成还车手续，订单将进入已完成状态
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders
