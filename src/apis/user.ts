import http from '@/utils/http.ts'
import { CodeType } from "@/types/types.ts";

// 用户登录接口
export interface LoginParams {
  account?: string
  password?: string
  phone?: string
  code?: string
  type: 'code' | 'pwd'
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email?: string
    phone?: string
    nickname?: string
    avatar?: string
  }
}

// 用户注册接口
export interface RegisterParams {
  account: string
  password: string
  code: string
}

export interface RegisterResponse {
  token: string
  user: {
    id: string
    email?: string
    phone: string
    nickname?: string
    avatar?: string
  }
}

// 发送验证码接口
export interface SendCodeParams {
  val: string
  type: CodeType
}

// 重置密码接口
export interface ResetPasswordParams {
  account: string
  code: string
  newPassword: string
}

// 微信登录接口
export interface WechatLoginParams {
  code: string
  state?: string
}

export function loginApi(params: LoginParams) {
  return http<LoginResponse>('user/login', params, null, 'post')
}

export function registerApi(params: RegisterParams) {
  return http<RegisterResponse>('user/register', params, null, 'post')
}

export function sendCode(params: SendCodeParams) {
  return http<boolean>('user/sendCode', null, params, 'get')
}

export function resetPasswordApi(params: ResetPasswordParams) {
  return http<boolean>('user/resetPassword', params, null, 'post')
}

export function wechatLogin(params: WechatLoginParams) {
  return http<LoginResponse>('user/wechatLogin', params, null, 'post')
}

export function refreshToken() {
  return http<{ token: string }>('user/refreshToken', null, null, 'post')
}

// 获取用户信息
export function getUserInfo() {
  return http<LoginResponse['user']>('user/userInfo', null, null, 'get')
}

// 设置密码
export function setPassword(password: string) {
  return http('user/setPassword', {password}, null, 'post')
}
