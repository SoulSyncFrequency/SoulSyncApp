import axios from "axios";
import { User, Device } from "./types";

export class DefaultService {
  static async getHealthz(): Promise<any> { const r = await axios.get(`/healthz`); return r.data; }
  static async getReadyz(): Promise<any> { const r = await axios.get(`/readyz`); return r.data; }
  static async getVersion(): Promise<any> { const r = await axios.get(`/version`); return r.data; }
  static async getMetrics(): Promise<any> { const r = await axios.get(`/metrics`); return r.data; }
  static async getAdminDiagnostics(): Promise<any> { const r = await axios.get(`/admin/diagnostics`); return r.data; }
  static async postBillingCreate-checkout-session(body: { userId: string }): Promise<any> { const r = await axios.post(`/api/billing/create-checkout-session`, body); return r.data; }
  static async postBillingWebhook(body: None): Promise<any> { const r = await axios.post(`/api/billing/webhook`, body); return r.data; }
  static async getMeEntitlements(): Promise<any> { const r = await axios.get(`/api/me/entitlements`); return r.data; }
  static async getAdminDevices(): Promise<Device[]> { const r = await axios.get(`/api/admin/devices`); return r.data; }
  static async postAdminDevices(body: { name: string, type: string }): Promise<Device> { const r = await axios.post(`/api/admin/devices`, body); return r.data; }
  static async postAuthLogin(body: { email: string, password: string }): Promise<any> { const r = await axios.post(`/api/auth/login`, body); return r.data; }
  static async getAuthMe(): Promise<User> { const r = await axios.get(`/api/auth/me`); return r.data; }
  static async postDevicesRegister(body: { deviceId: string, platform: string }): Promise<any> { const r = await axios.post(`/api/devices/register`, body); return r.data; }
  static async getFlags(): Promise<any> { const r = await axios.get(`/api/flags`); return r.data; }
  static async postTherapy(body: { input: string }): Promise<any> { const r = await axios.post(`/api/therapy`, body); return r.data; }
  static async postVerifierAnalyze(body: { text: string }): Promise<any> { const r = await axios.post(`/api/verifier/analyze`, body); return r.data; }
}
