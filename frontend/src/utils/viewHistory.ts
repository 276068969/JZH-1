import axios from 'axios'

export interface RecentViewItem {
  id: number
  name: string
  type: string
  price: number
  location: string
  available: boolean
  rating: number
  viewedAt: number
}

const STORAGE_KEY = 'recent_view_history'
const MAX_HISTORY = 20

const getLocalHistory = (): RecentViewItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const setLocalHistory = (history: RecentViewItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to save view history to localStorage', e)
  }
}

const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token')
}

export const addViewHistory = async (
  vehicle: Omit<RecentViewItem, 'viewedAt'>,
  sourcePage: 'home' | 'list' | 'detail'
): Promise<void> => {
  const item: RecentViewItem = {
    ...vehicle,
    viewedAt: Date.now()
  }

  let history = getLocalHistory()
  history = history.filter(h => h.id !== vehicle.id)
  history.unshift(item)
  history = history.slice(0, MAX_HISTORY)
  setLocalHistory(history)

  if (isAuthenticated()) {
    try {
      await axios.post('/api/view-history', {
        vehicleId: vehicle.id,
        sourcePage
      })
    } catch (e) {
      console.error('Failed to sync view history to server', e)
    }
  }
}

export const getRecentViewHistory = async (limit: number = 10): Promise<RecentViewItem[]> => {
  if (isAuthenticated()) {
    try {
      const response = await axios.get('/api/view-history', { params: { limit } })
      if (response.data?.code === 200 && Array.isArray(response.data.data)) {
        const serverHistory: RecentViewItem[] = response.data.data.map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          price: v.price,
          location: v.location,
          available: v.available,
          rating: v.rating,
          viewedAt: Date.now()
        }))
        return serverHistory.slice(0, limit)
      }
    } catch (e) {
      console.error('Failed to get view history from server', e)
    }
  }

  const localHistory = getLocalHistory()
  return localHistory.slice(0, limit)
}

export const getRecentViewedIds = async (limit: number = 50): Promise<number[]> => {
  if (isAuthenticated()) {
    try {
      const response = await axios.get('/api/view-history/ids', { params: { limit } })
      if (response.data?.code === 200 && Array.isArray(response.data.data)) {
        return response.data.data.map(Number)
      }
    } catch (e) {
      console.error('Failed to get view history IDs from server', e)
    }
  }

  const localHistory = getLocalHistory()
  return localHistory.slice(0, limit).map(h => h.id)
}

export const reorderVehiclesByRecentView = <T extends { id: number }>(
  vehicles: T[],
  recentIds: number[]
): T[] => {
  if (!recentIds || recentIds.length === 0) {
    return vehicles
  }

  const idSet = new Set(recentIds)
  const recentVehicles: T[] = []
  const otherVehicles: T[] = []

  vehicles.forEach(v => {
    if (idSet.has(v.id)) {
      recentVehicles.push(v)
    } else {
      otherVehicles.push(v)
    }
  })

  recentVehicles.sort((a, b) => {
    return recentIds.indexOf(a.id) - recentIds.indexOf(b.id)
  })

  return [...recentVehicles, ...otherVehicles]
}

export const clearLocalViewHistory = () => {
  localStorage.removeItem(STORAGE_KEY)
}
