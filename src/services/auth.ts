import type { ApiResponse, AuthUser, LoginResponse } from '@/types'
import { api } from './api'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      { email, password },
      { skipAuthRefresh: true },
    )
    return res.data.data
  },
  async logout(refreshToken: string | null): Promise<void> {
    await api.post('/auth/logout', { refreshToken }, { skipAuthRefresh: true })
  },
  async me(): Promise<AuthUser> {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me')
    return res.data.data
  },
  async updateProfile(input: { name: string; email: string; avatar?: string | null }) {
    const res = await api.put<ApiResponse<AuthUser>>('/auth/profile', input)
    return res.data.data
  },
  async changePassword(input: { currentPassword: string; newPassword: string }) {
    await api.put('/auth/change-password', input)
  },
  async forgotPassword(email: string) {
    await api.post('/auth/forgot-password', { email }, { skipAuthRefresh: true })
  },
  async resetPassword(input: { token: string; password: string }) {
    await api.post('/auth/reset-password', input, { skipAuthRefresh: true })
  },
}
