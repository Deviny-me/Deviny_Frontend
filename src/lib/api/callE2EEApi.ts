/**
 * REST client for `/api/me/call-e2ee/*` endpoints.
 *
 * The backend is a passive key directory: it stores public bundles and
 * relays opaque ciphertext. All private keys live in IndexedDB.
 */

import { API_URL, fetchWithAuth } from '@/lib/config'
import type {
  CallDeviceStatus,
  FetchPeerBundleRequest,
  PeerBundleResponse,
  RegisterCallBundleRequest,
} from '@/types/callE2EE'

export class CallE2EEApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'CallE2EEApiError'
    this.status = status
  }
}

async function jsonOrThrow<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    let detail = fallback
    try {
      const data = await response.json()
      detail = (data && (data.detail || data.title)) || fallback
    } catch { /* ignore */ }
    throw new CallE2EEApiError(detail, response.status)
  }
  return response.json() as Promise<T>
}

export const callE2EEApi = {
  async registerBundle(payload: RegisterCallBundleRequest): Promise<CallDeviceStatus> {
    const response = await fetchWithAuth(`${API_URL}/me/call-e2ee/bundle`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return jsonOrThrow<CallDeviceStatus>(response, 'Failed to register call E2EE bundle')
  },

  async listMyDevices(): Promise<CallDeviceStatus[]> {
    const response = await fetchWithAuth(`${API_URL}/me/call-e2ee/devices`)
    return jsonOrThrow<CallDeviceStatus[]>(response, 'Failed to list call E2EE devices')
  },

  async getPeerStatus(userId: string, deviceId: string = 'primary'): Promise<CallDeviceStatus> {
    const params = new URLSearchParams({ deviceId })
    const response = await fetchWithAuth(`${API_URL}/me/call-e2ee/users/${userId}/status?${params.toString()}`)
    return jsonOrThrow<CallDeviceStatus>(response, 'Failed to check peer call E2EE status')
  },

  async fetchPeerBundle(userId: string, body: FetchPeerBundleRequest = {}): Promise<PeerBundleResponse> {
    const response = await fetchWithAuth(`${API_URL}/me/call-e2ee/users/${userId}/bundle`, {
      method: 'POST',
      body: JSON.stringify({
        deviceId: body.deviceId ?? 'primary',
        consumeOneTimePreKey: body.consumeOneTimePreKey ?? true,
        callId: body.callId,
      }),
    })
    return jsonOrThrow<PeerBundleResponse>(response, 'Failed to fetch peer call E2EE bundle')
  },

  async deleteMyDevice(deviceId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/me/call-e2ee/devices/${deviceId}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 404) {
      throw new CallE2EEApiError('Failed to delete call E2EE device', response.status)
    }
  },
}
