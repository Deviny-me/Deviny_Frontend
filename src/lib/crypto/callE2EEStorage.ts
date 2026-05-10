/**
 * IndexedDB storage for call-E2EE private material.
 *
 * Stored items (per key):
 *   - `identity`         : { privateJwk, publicJwk, publicB64, registrationId }
 *   - `signing-identity` : { privateJwk, publicJwk } (Ed25519 — for signing SPK)
 *   - `signed-pre-key`   : { keyId, privateJwk, publicJwk, publicB64, signature }
 *   - `one-time:<id>`    : { keyId, privateJwk, publicJwk, publicB64 }
 *   - `device-id`        : string
 *   - `bundle-registered`: boolean (last successful PUT)
 *   - `session:<peerUserId>:<peerDeviceId>` : { sharedKeyB64, peerIdentityB64, ourEphemeralB64 }
 */

const DB_NAME = 'deviny.callE2EE'
const DB_VERSION = 1
const STORE = 'kv'

function isAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) return reject(new Error('IndexedDB unavailable'))
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export async function dbGet<T = unknown>(key: string): Promise<T | undefined> {
  try {
    return await tx<T>('readonly', s => s.get(key) as IDBRequest<T>)
  } catch {
    return undefined
  }
}

export async function dbSet(key: string, value: unknown): Promise<void> {
  await tx('readwrite', s => s.put(value, key))
}

export async function dbDelete(key: string): Promise<void> {
  await tx('readwrite', s => s.delete(key))
}

export async function dbKeys(prefix?: string): Promise<string[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const out: string[] = []
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).openKeyCursor()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const cur = req.result
      if (!cur) return resolve(out)
      const k = String(cur.key)
      if (!prefix || k.startsWith(prefix)) out.push(k)
      cur.continue()
    }
  })
}

export async function dbClear(): Promise<void> {
  await tx('readwrite', s => s.clear())
}

export function isIdbAvailable(): boolean {
  return isAvailable()
}
