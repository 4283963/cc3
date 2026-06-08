import axios from 'axios'
import type {
  EfficiencyRankingResponse,
  WeightConfig,
  WeightConfigUpdate,
  HighRiskAlertListResponse,
} from '../types'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export interface GetRankingsParams {
  time_range?: string
  days?: number
  start_date?: string
  end_date?: string
}

export const efficiencyApi = {
  getRankings: async (params?: GetRankingsParams): Promise<EfficiencyRankingResponse> => {
    const response = await request.get('/efficiency/rankings', { params })
    return response.data
  },

  getUserEfficiency: async (userId: number, days: number = 30) => {
    const response = await request.get(`/efficiency/user/${userId}`, {
      params: { days },
    })
    return response.data
  },
}

export const weightsApi = {
  getWeights: async (): Promise<WeightConfig> => {
    const response = await request.get('/weights')
    return response.data
  },

  updateWeights: async (data: WeightConfigUpdate): Promise<WeightConfig> => {
    const response = await request.put('/weights', data)
    return response.data
  },

  recalculate: async () => {
    const response = await request.post('/weights/recalculate')
    return response.data
  },
}

export const healthApi = {
  check: async () => {
    const response = await request.get('/health')
    return response.data
  },
}

export interface GetAlertsParams {
  resolved?: boolean
  limit?: number
  offset?: number
}

export const alertsApi = {
  getAlerts: async (params?: GetAlertsParams): Promise<HighRiskAlertListResponse> => {
    const response = await request.get('/alerts', { params })
    return response.data
  },

  scanAlerts: async () => {
    const response = await request.post('/alerts/scan')
    return response.data
  },

  resolveAlert: async (alertId: number) => {
    const response = await request.post(`/alerts/${alertId}/resolve`)
    return response.data
  },
}
