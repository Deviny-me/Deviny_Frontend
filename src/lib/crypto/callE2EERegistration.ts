/**
 * Bundle registration helper — call once after login (or on app startup with
 * an active session) to publish/refresh our public call-E2EE bundle.
 *
 * Idempotent: it only PUTs the bundle when:
 *   - we have not yet registered, OR
 *   - we currently have fewer than ONE_TIME_PREKEY_LOW_WATERMARK one-time
 *     pre-keys locally and want to top up.
 */

import { callE2EEApi } from '@/lib/api/callE2EEApi'
import {
  buildBundleRequest,
  ensureLocalMaterial,
  isBundleRegistered,
  isCallE2EESupported,
  markBundleRegistered,
  ONE_TIME_PREKEY_LOW_WATERMARK,
} from './callE2EE'

let inFlight: Promise<boolean> | null = null

export function ensureCallE2EERegistered(): Promise<boolean> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    if (!isCallE2EESupported()) return false
    try {
      const mat = await ensureLocalMaterial()
      const already = await isBundleRegistered()
      // Re-publish when local one-time pre-keys are low (server may have consumed many).
      const shouldRepublish = !already || mat.oneTimePreKeys.length < ONE_TIME_PREKEY_LOW_WATERMARK
      if (!shouldRepublish) return true

      const bundle = await buildBundleRequest()
      try {
        await callE2EEApi.registerBundle(bundle)
        await markBundleRegistered()
        return true
      } catch (err) {
        console.warn('[CallE2EE] Bundle registration failed', err)
        return false
      }
    } catch (err) {
      console.warn('[CallE2EE] Local material generation failed', err)
      return false
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
