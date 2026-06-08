import axios from 'axios'
import type { EfficiencyRankingResponse, WeightConfig, WeightConfigUpdate } from '../types'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const efficiencyApi = {
  getRankings: async (): Promise<EfficiencyRankingResponse> => {
    const response = await request.get('/efficiency/rankings')
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
