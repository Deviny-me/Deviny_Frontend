/**
 * Client-side end-to-end encryption (E2EE) for direct chats.
 *
 * Backend is a passive ciphertext store: it accepts/returns whatever
 * string we put in `text`, hosts public keys, and exposes them to peers.
 *
 * Protocol (hybrid RSA-OAEP + AES-GCM):
 *   1. Each user generates a 2048-bit RSA-OAEP keypair on first chat use.
 *      Private key (JWK) lives in localStorage, never leaves the device.
 *      Public key (SPKI/base64) is uploaded via `PUT /api/me/chat-key`.
 *   2. To send a message:
 *        - generate a fresh AES-256-GCM session key + 12-byte IV
 *        - encrypt the plaintext with AES-GCM
 *        - wrap (encrypt) the AES key with each recipient's RSA public key
 *          (recipients = peer + self, so the sender can also decrypt their
 *          own outgoing message when it echoes back)
 *        - serialize as `enc:v1:<base64-json>`
 *   3. To decrypt: parse the envelope, find the wrapped key for our userId,
 *      RSA-unwrap it, then AES-decrypt the payload.
 *
 * Backwards compatibility: legacy plaintext messages (no `enc:v1:` prefix)
 * are returned as-is. If a peer's public key cannot be fetched, we fall
 * back to plaintext sending so chats with not-yet-upgraded clients keep
 * working — the backend still does not refuse, per the new contract.
 */

const ENVELOPE_PREFIX = 'enc:v1:'
const PRIVATE_KEY_STORAGE_PREFIX = 'deviny.e2ee.privKey.'
const PUBLIC_KEY_STORAGE_PREFIX = 'deviny.e2ee.pubKey.'
const PUBLISHED_FLAG_PREFIX = 'deviny.e2ee.published.'

interface EncryptedEnvelope {
  v: 1
  iv: string // base64
  ct: string // base64 (AES-GCM ciphertext)
  /** Map of lowercased userId → base64(RSA-OAEP-wrapped raw AES key). */
  keys: Record<string, string>
}

// ─── base64 helpers ───

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function b64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const out = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out as Uint8Array<ArrayBuffer>
}

function isCryptoAvailable(): boolean {
  return typeof window !== 'undefined'
    && typeof window.crypto !== 'undefined'
    && typeof window.crypto.subtle !== 'undefined'
}

// ─── in-memory caches ───

interface KeypairCache {
  privateKey: CryptoKey
  publicKey: CryptoKey
  publicKeyB64: string // SPKI base64 (what we PUT to the server)
}

let myKeypairCache: KeypairCache | null = null
let myKeypairUserId: string | null = null
const peerPublicKeyCache = new Map<string, CryptoKey>() // userId(lower) → CryptoKey

// ─── keypair management ───

async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt'],
  )
}

async function importPublicKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt'],
  )
}

async function importPublicKeyFromSpkiB64(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    b64ToBuf(b64).buffer as ArrayBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt'],
  )
}

async function exportPublicKeySpkiB64(publicKey: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', publicKey)
  return bufToB64(spki)
}

async function generateKeypair(): Promise<KeypairCache> {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  )
  const publicKeyB64 = await exportPublicKeySpkiB64(pair.publicKey)
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, publicKeyB64 }
}

function privKeyStorageKey(userId: string): string {
  return PRIVATE_KEY_STORAGE_PREFIX + userId.toLowerCase()
}

function pubKeyStorageKey(userId: string): string {
  return PUBLIC_KEY_STORAGE_PREFIX + userId.toLowerCase()
}

function publishedFlagKey(userId: string): string {
  return PUBLISHED_FLAG_PREFIX + userId.toLowerCase()
}

async function loadOrGenerateMyKeypair(userId: string): Promise<KeypairCache> {
  if (myKeypairCache && myKeypairUserId === userId.toLowerCase()) {
    return myKeypairCache
  }

  const lower = userId.toLowerCase()
  let cache: KeypairCache | null = null

  try {
    const privRaw = localStorage.getItem(privKeyStorageKey(lower))
    const pubRaw = localStorage.getItem(pubKeyStorageKey(lower))
    if (privRaw && pubRaw) {
      const privJwk = JSON.parse(privRaw) as JsonWebKey
      const pubB64 = pubRaw
      const privateKey = await importPrivateKey(privJwk)
      const publicKey = await importPublicKeyFromSpkiB64(pubB64)
      cache = { privateKey, publicKey, publicKeyB64: pubB64 }
    }
  } catch (err) {
    console.warn('[E2EE] Failed to restore stored keypair, regenerating:', err)
    cache = null
  }

  if (!cache) {
    cache = await generateKeypair()
    try {
      const privJwk = await crypto.subtle.exportKey('jwk', cache.privateKey)
      localStorage.setItem(privKeyStorageKey(lower), JSON.stringify(privJwk))
      localStorage.setItem(pubKeyStorageKey(lower), cache.publicKeyB64)
      // Force re-publish since this is a fresh key.
      localStorage.removeItem(publishedFlagKey(lower))
    } catch (err) {
      console.warn('[E2EE] Failed to persist keypair to localStorage:', err)
    }
  }

  myKeypairCache = cache
  myKeypairUserId = lower
  return cache
}

/**
 * Ensure the current user has a keypair locally and publish the public key
 * to the backend. Safe to call repeatedly — only PUTs once per stored key.
 */
export async function ensureMyKeypairAndPublish(
  userId: string,
  putPublicKey: (publicKey: string) => Promise<unknown>,
): Promise<void> {
  if (!isCryptoAvailable() || !userId) return
  const lower = userId.toLowerCase()
  const cache = await loadOrGenerateMyKeypair(lower)

  try {
    const flagKey = publishedFlagKey(lower)
    const published = localStorage.getItem(flagKey)
    if (published === cache.publicKeyB64) return
    await putPublicKey(cache.publicKeyB64)
    localStorage.setItem(flagKey, cache.publicKeyB64)
  } catch (err) {
    console.warn('[E2EE] Failed to publish public key (will retry next session):', err)
  }
}

// ─── peer key fetching / caching ───

/**
 * Fetch and cache another user's public key. Returns null if the peer has
 * no key on file (so the caller can fall back to plaintext send).
 */
export async function getPeerPublicKey(
  peerUserId: string,
  fetchPeerKey: (userId: string) => Promise<{ publicKey: string | null } | null>,
): Promise<CryptoKey | null> {
  if (!isCryptoAvailable() || !peerUserId) return null
  const lower = peerUserId.toLowerCase()
  const cached = peerPublicKeyCache.get(lower)
  if (cached) return cached

  try {
    const res = await fetchPeerKey(peerUserId)
    const b64 = res?.publicKey
    if (!b64) return null
    const key = await importPublicKeyFromSpkiB64(b64)
    peerPublicKeyCache.set(lower, key)
    return key
  } catch (err) {
    console.warn('[E2EE] Failed to fetch peer public key:', err)
    return null
  }
}

/** Drop the cached peer public key (e.g., after a decrypt failure). */
export function invalidatePeerPublicKey(peerUserId: string): void {
  peerPublicKeyCache.delete(peerUserId.toLowerCase())
}

// ─── encrypt / decrypt ───

export function isEncryptedEnvelope(text: string | null | undefined): boolean {
  return typeof text === 'string' && text.startsWith(ENVELOPE_PREFIX)
}

/**
 * Encrypt `plaintext` for the given list of recipients (each identified by
 * their userId + RSA public key). Returns the serialized envelope string,
 * or `null` if encryption is unavailable / no recipients.
 */
export async function encryptForRecipients(
  plaintext: string,
  recipients: { userId: string; publicKey: CryptoKey }[],
): Promise<string | null> {
  if (!isCryptoAvailable() || recipients.length === 0) return null

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ctBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext),
  )
  const rawAes = await crypto.subtle.exportKey('raw', aesKey)

  const keys: Record<string, string> = {}
  for (const r of recipients) {
    try {
      const wrapped = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        r.publicKey,
        rawAes,
      )
      keys[r.userId.toLowerCase()] = bufToB64(wrapped)
    } catch (err) {
      console.warn('[E2EE] Failed to wrap AES key for', r.userId, err)
    }
  }

  if (Object.keys(keys).length === 0) return null

  const envelope: EncryptedEnvelope = {
    v: 1,
    iv: bufToB64(iv),
    ct: bufToB64(ctBuf),
    keys,
  }
  return ENVELOPE_PREFIX + bufToB64(new TextEncoder().encode(JSON.stringify(envelope)))
}

/**
 * Decrypt an envelope using the current user's private key. Returns the
 * original string unchanged if it isn't an envelope, or a placeholder
 * marker on decrypt failure (so the UI can render *something*).
 */
export async function decryptIncoming(
  text: string | null | undefined,
  myUserId: string | null | undefined,
): Promise<string> {
  if (!text) return ''
  if (!isEncryptedEnvelope(text)) return text
  if (!isCryptoAvailable() || !myUserId) return text

  try {
    const cache = await loadOrGenerateMyKeypair(myUserId)
    const jsonBytes = b64ToBuf(text.slice(ENVELOPE_PREFIX.length))
    const envelope = JSON.parse(new TextDecoder().decode(jsonBytes)) as EncryptedEnvelope
    if (!envelope || envelope.v !== 1) return text

    const wrapped = envelope.keys[myUserId.toLowerCase()]
    if (!wrapped) {
      // Not addressed to this user (e.g., legacy/cross-device).
      return text
    }

    const rawAes = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      cache.privateKey,
      b64ToBuf(wrapped).buffer as ArrayBuffer,
    )
    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawAes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    )
    const ptBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBuf(envelope.iv) },
      aesKey,
      b64ToBuf(envelope.ct).buffer as ArrayBuffer,
    )
    return new TextDecoder().decode(ptBuf)
  } catch (err) {
    console.warn('[E2EE] Failed to decrypt envelope:', err)
    return text
  }
}

/**
 * Convenience: encrypt a message for a peer + self, fetching keys via the
 * provided callbacks. Returns the envelope on success, or `null` if either
 * key is unavailable (caller falls back to plaintext).
 */
export async function encryptForPeer(
  plaintext: string,
  myUserId: string,
  peerUserId: string,
  fetchPeerKey: (userId: string) => Promise<{ publicKey: string | null } | null>,
): Promise<string | null> {
  if (!isCryptoAvailable() || !plaintext) return null

  try {
    const me = await loadOrGenerateMyKeypair(myUserId)
    const peer = await getPeerPublicKey(peerUserId, fetchPeerKey)
    if (!peer) return null
    return await encryptForRecipients(plaintext, [
      { userId: myUserId, publicKey: me.publicKey },
      { userId: peerUserId, publicKey: peer },
    ])
  } catch (err) {
    console.warn('[E2EE] encryptForPeer failed:', err)
    return null
  }
}
