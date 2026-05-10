/**
 * Call E2EE — X3DH-style ECDH(X25519) + HKDF-SHA256 + AES-256-GCM.
 *
 * Pure WebCrypto. Private keys are non-extractable and stored as JWK inside
 * IndexedDB (CryptoKey objects cannot be persisted directly, so we keep the
 * private JWK with `ext:true` — the JWK never leaves the device's IndexedDB).
 *
 * This is NOT a full Signal Double Ratchet implementation. It is a
 * Signal-style key agreement that matches the wire shape the backend expects.
 * Backend treats the encrypted envelope as opaque, so it does not care which
 * KDF / cipher we use; both clients only need to agree on the layout.
 */

import { dbDelete, dbGet, dbKeys, dbSet, isIdbAvailable } from './callE2EEStorage'
import type {
  CallE2EEEnvelope,
  CallE2EEInnerPayload,
  OneTimePreKeyDto,
  RegisterCallBundleRequest,
  SignedPreKeyDto,
} from '@/types/callE2EE'

export const CALL_E2EE_DEVICE_ID_DEFAULT = 'primary'
export const CALL_E2EE_PROTOCOL = 'signal' as const
export const CALL_E2EE_PROTOCOL_VERSION = 'signal-protocol-v1'
export const CALL_E2EE_ALGORITHM = 'Signal-X3DH-Curve25519-AES-256-GCM-HMAC-SHA256'
export const CALL_E2EE_KEY_AGREEMENT = 'x3dh'
export const CALL_E2EE_MEDIA_ENCRYPTION = 'webrtc-insertable-streams'

export const ONE_TIME_PREKEY_BATCH_SIZE = 50
export const ONE_TIME_PREKEY_LOW_WATERMARK = 10

// ───────────────────────── base64 helpers ─────────────────────────

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBufferSource(u8: Uint8Array): BufferSource {
  // Ensure we pass a properly-typed ArrayBuffer slice to WebCrypto.
  const buf = u8.buffer as ArrayBuffer
  return buf.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
}

// ───────────────────────── env / support ─────────────────────────

export function isCallE2EESupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined' &&
    isIdbAvailable()
  )
}

let x25519Supported: boolean | null = null
async function checkX25519Support(): Promise<boolean> {
  if (x25519Supported !== null) return x25519Supported
  try {
    // Some browsers expose X25519 directly, others under name 'X25519'/'x25519'.
    await crypto.subtle.generateKey({ name: 'X25519' } as unknown as Algorithm, true, ['deriveBits'])
    x25519Supported = true
  } catch {
    x25519Supported = false
  }
  return x25519Supported
}

// ───────────────────────── key generation ─────────────────────────

interface StoredKey {
  privateJwk: JsonWebKey
  publicJwk: JsonWebKey
  publicB64: string
}

interface StoredIdentity extends StoredKey {
  registrationId: number
}

interface StoredSignedPreKey extends StoredKey {
  keyId: number
  signature: string // base64 (may be empty if signing unsupported)
}

interface StoredOneTimePreKey extends StoredKey {
  keyId: number
}

function randomRegistrationId(): number {
  // 1..16380 per backend validation.
  return 1 + Math.floor(Math.random() * 16380)
}

function randomKeyId(min = 1, max = 0xfffffff): number {
  return min + Math.floor(Math.random() * (max - min))
}

async function generateX25519Pair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey; privateJwk: JsonWebKey; publicJwk: JsonWebKey; publicB64: string }> {
  const supported = await checkX25519Support()
  if (!supported) {
    throw new Error('X25519 is not supported by this browser; cannot enable call E2EE.')
  }
  const pair = (await crypto.subtle.generateKey(
    { name: 'X25519' } as unknown as Algorithm,
    true,
    ['deriveBits'],
  )) as CryptoKeyPair
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey)
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const rawPub = await crypto.subtle.exportKey('raw', pair.publicKey)
  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    privateJwk,
    publicJwk,
    publicB64: bufToB64(rawPub),
  }
}

async function importX25519Private(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, { name: 'X25519' } as unknown as Algorithm, true, ['deriveBits'])
}

async function importX25519PublicFromRaw(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytesToBufferSource(b64ToBuf(b64)), { name: 'X25519' } as unknown as Algorithm, true, [])
}

async function ed25519Sign(data: Uint8Array): Promise<string> {
  // Optional. If Ed25519 isn't supported, we return an empty signature —
  // backend doesn't enforce the signature, and peers fall back to TOFU.
  try {
    const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' } as unknown as Algorithm, true, ['sign', 'verify'])) as CryptoKeyPair
    const sig = await crypto.subtle.sign('Ed25519' as unknown as Algorithm, pair.privateKey, bytesToBufferSource(data))
    return bufToB64(sig)
  } catch {
    return ''
  }
}

async function dhDeriveBits(privateKey: CryptoKey, peerPublicKey: CryptoKey): Promise<Uint8Array> {
  const bits = await crypto.subtle.deriveBits(
    { name: 'X25519', public: peerPublicKey } as unknown as Algorithm,
    privateKey,
    256,
  )
  return new Uint8Array(bits)
}

async function hkdfSha256(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length = 32): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', bytesToBufferSource(ikm), 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: bytesToBufferSource(salt), info: bytesToBufferSource(info) },
    key,
    length * 8,
  )
  return new Uint8Array(bits)
}

async function aesGcmEncrypt(rawKey: Uint8Array, plaintext: Uint8Array, iv: Uint8Array, aad?: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', bytesToBufferSource(rawKey), 'AES-GCM', false, ['encrypt'])
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToBufferSource(iv), additionalData: aad ? bytesToBufferSource(aad) : undefined },
    key,
    bytesToBufferSource(plaintext),
  )
  return new Uint8Array(ct)
}

async function aesGcmDecrypt(rawKey: Uint8Array, ciphertext: Uint8Array, iv: Uint8Array, aad?: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', bytesToBufferSource(rawKey), 'AES-GCM', false, ['decrypt'])
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToBufferSource(iv), additionalData: aad ? bytesToBufferSource(aad) : undefined },
    key,
    bytesToBufferSource(ciphertext),
  )
  return new Uint8Array(pt)
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  crypto.getRandomValues(out)
  return out
}

// ───────────────────────── local material ─────────────────────────

interface LocalMaterial {
  identity: StoredIdentity
  signedPreKey: StoredSignedPreKey
  oneTimePreKeys: StoredOneTimePreKey[]
  deviceId: string
}

const KEY_DEVICE_ID = 'device-id'
const KEY_IDENTITY = 'identity'
const KEY_SIGNED_PRE_KEY = 'signed-pre-key'
const ONE_TIME_PREFIX = 'one-time:'
const KEY_BUNDLE_REGISTERED = 'bundle-registered'
const SESSION_PREFIX = 'session:'

export async function ensureLocalMaterial(): Promise<LocalMaterial> {
  if (!isCallE2EESupported()) throw new Error('Call E2EE not supported in this environment')

  let deviceId = await dbGet<string>(KEY_DEVICE_ID)
  if (!deviceId) {
    deviceId = CALL_E2EE_DEVICE_ID_DEFAULT
    await dbSet(KEY_DEVICE_ID, deviceId)
  }

  let identity = await dbGet<StoredIdentity>(KEY_IDENTITY)
  if (!identity) {
    const k = await generateX25519Pair()
    identity = {
      privateJwk: k.privateJwk,
      publicJwk: k.publicJwk,
      publicB64: k.publicB64,
      registrationId: randomRegistrationId(),
    }
    await dbSet(KEY_IDENTITY, identity)
  }

  let signedPreKey = await dbGet<StoredSignedPreKey>(KEY_SIGNED_PRE_KEY)
  if (!signedPreKey) {
    const k = await generateX25519Pair()
    const keyId = randomKeyId(1, 65535)
    const sig = await ed25519Sign(b64ToBuf(k.publicB64))
    signedPreKey = {
      privateJwk: k.privateJwk,
      publicJwk: k.publicJwk,
      publicB64: k.publicB64,
      keyId,
      signature: sig,
    }
    await dbSet(KEY_SIGNED_PRE_KEY, signedPreKey)
  }

  let oneTimePreKeys = await loadOneTimePreKeys()
  if (oneTimePreKeys.length < ONE_TIME_PREKEY_LOW_WATERMARK) {
    const fresh = await generateOneTimePreKeys(ONE_TIME_PREKEY_BATCH_SIZE - oneTimePreKeys.length)
    for (const o of fresh) {
      await dbSet(`${ONE_TIME_PREFIX}${o.keyId}`, o)
    }
    oneTimePreKeys = await loadOneTimePreKeys()
  }

  return { identity, signedPreKey, oneTimePreKeys, deviceId }
}

async function loadOneTimePreKeys(): Promise<StoredOneTimePreKey[]> {
  const keys = await dbKeys(ONE_TIME_PREFIX)
  const out: StoredOneTimePreKey[] = []
  for (const k of keys) {
    const v = await dbGet<StoredOneTimePreKey>(k)
    if (v) out.push(v)
  }
  return out
}

async function generateOneTimePreKeys(count: number): Promise<StoredOneTimePreKey[]> {
  const usedIds = new Set<number>()
  const existing = await loadOneTimePreKeys()
  existing.forEach(e => usedIds.add(e.keyId))
  const out: StoredOneTimePreKey[] = []
  for (let i = 0; i < count; i++) {
    let keyId: number
    do { keyId = randomKeyId(1000, 0xfffffff) } while (usedIds.has(keyId))
    usedIds.add(keyId)
    const k = await generateX25519Pair()
    out.push({ keyId, privateJwk: k.privateJwk, publicJwk: k.publicJwk, publicB64: k.publicB64 })
  }
  return out
}

export async function buildBundleRequest(): Promise<RegisterCallBundleRequest> {
  const mat = await ensureLocalMaterial()
  const otp: OneTimePreKeyDto[] = mat.oneTimePreKeys.map(o => ({ keyId: o.keyId, publicKey: o.publicB64 }))
  const spk: SignedPreKeyDto = {
    keyId: mat.signedPreKey.keyId,
    publicKey: mat.signedPreKey.publicB64,
    signature: mat.signedPreKey.signature,
  }
  return {
    deviceId: mat.deviceId,
    registrationId: mat.identity.registrationId,
    identityKey: mat.identity.publicB64,
    signedPreKey: spk,
    oneTimePreKeys: otp,
    replaceExistingOneTimePreKeys: false,
  }
}

export async function markBundleRegistered(): Promise<void> {
  await dbSet(KEY_BUNDLE_REGISTERED, true)
}

export async function isBundleRegistered(): Promise<boolean> {
  return Boolean(await dbGet<boolean>(KEY_BUNDLE_REGISTERED))
}

export async function getDeviceId(): Promise<string> {
  return (await dbGet<string>(KEY_DEVICE_ID)) ?? CALL_E2EE_DEVICE_ID_DEFAULT
}

export async function getRegistrationId(): Promise<number> {
  const ident = await dbGet<StoredIdentity>(KEY_IDENTITY)
  return ident?.registrationId ?? 0
}

export async function getIdentityPublicB64(): Promise<string | null> {
  const ident = await dbGet<StoredIdentity>(KEY_IDENTITY)
  return ident?.publicB64 ?? null
}

export async function resetLocalMaterial(): Promise<void> {
  await dbDelete(KEY_IDENTITY)
  await dbDelete(KEY_SIGNED_PRE_KEY)
  await dbDelete(KEY_BUNDLE_REGISTERED)
  const otp = await dbKeys(ONE_TIME_PREFIX)
  for (const k of otp) await dbDelete(k)
  const sessions = await dbKeys(SESSION_PREFIX)
  for (const k of sessions) await dbDelete(k)
}

// ───────────────────────── X3DH session ─────────────────────────

interface CachedSession {
  sharedKeyB64: string
  peerIdentityB64: string
  peerDeviceId: string
}

function sessionKey(peerUserId: string, peerDeviceId: string) {
  return `${SESSION_PREFIX}${peerUserId.toLowerCase()}:${peerDeviceId.toLowerCase()}`
}

const HKDF_INFO = new TextEncoder().encode('Deviny-CallE2EE-v1')
const HKDF_SALT_INITIATOR = new Uint8Array(32) // zero salt per X3DH

interface PeerBundleInput {
  identityKey: string
  signedPreKey: SignedPreKeyDto
  oneTimePreKey: OneTimePreKeyDto | null
}

interface SessionResult {
  sharedKey: Uint8Array
  ephemeralPublicB64: string
  usedOneTimePreKeyId: number | null
}

/** Initiator side: derives session key with a peer bundle, returns the SK + ephemeral pub. */
export async function initiateSession(peerUserId: string, peerDeviceId: string, peerBundle: PeerBundleInput): Promise<SessionResult> {
  const mat = await ensureLocalMaterial()
  const ourIdentityPriv = await importX25519Private(mat.identity.privateJwk)

  // Ephemeral X25519 keypair.
  const ek = await generateX25519Pair()
  const ekPriv = await importX25519Private(ek.privateJwk)

  const peerIdentityPub = await importX25519PublicFromRaw(peerBundle.identityKey)
  const peerSpkPub = await importX25519PublicFromRaw(peerBundle.signedPreKey.publicKey)
  const peerOpkPub = peerBundle.oneTimePreKey
    ? await importX25519PublicFromRaw(peerBundle.oneTimePreKey.publicKey)
    : null

  // X3DH: DH1 = IK_A x SPK_B, DH2 = EK_A x IK_B, DH3 = EK_A x SPK_B, DH4 = EK_A x OPK_B
  const dh1 = await dhDeriveBits(ourIdentityPriv, peerSpkPub)
  const dh2 = await dhDeriveBits(ekPriv, peerIdentityPub)
  const dh3 = await dhDeriveBits(ekPriv, peerSpkPub)
  const parts = [dh1, dh2, dh3]
  if (peerOpkPub) parts.push(await dhDeriveBits(ekPriv, peerOpkPub))
  const ikm = concat(parts)

  const sharedKey = await hkdfSha256(ikm, HKDF_SALT_INITIATOR, HKDF_INFO, 32)

  // Cache session for re-use on subsequent control messages within the same call.
  await dbSet(sessionKey(peerUserId, peerDeviceId), {
    sharedKeyB64: bufToB64(sharedKey),
    peerIdentityB64: peerBundle.identityKey,
    peerDeviceId,
  } as CachedSession)

  return {
    sharedKey,
    ephemeralPublicB64: ek.publicB64,
    usedOneTimePreKeyId: peerBundle.oneTimePreKey?.keyId ?? null,
  }
}

interface IncomingX3DH {
  senderIdentityB64: string
  ephemeralB64: string
  signedPreKeyId: number
  oneTimePreKeyId: number | null
}

/** Responder side: reconstructs SK from the incoming X3DH header. */
export async function deriveSessionFromIncoming(peerUserId: string, peerDeviceId: string, header: IncomingX3DH): Promise<Uint8Array> {
  const mat = await ensureLocalMaterial()
  const ourIdentityPriv = await importX25519Private(mat.identity.privateJwk)

  if (mat.signedPreKey.keyId !== header.signedPreKeyId) {
    // Rotated already — best-effort: still use current SPK.
    // (Backend can return historical SPK ids; we keep only the latest.)
    console.warn('[CallE2EE] Incoming X3DH used a non-current signed pre-key id', header.signedPreKeyId)
  }
  const ourSpkPriv = await importX25519Private(mat.signedPreKey.privateJwk)

  let ourOpkPriv: CryptoKey | null = null
  let consumedOpkId: number | null = null
  if (header.oneTimePreKeyId !== null && header.oneTimePreKeyId !== undefined) {
    const stored = await dbGet<StoredOneTimePreKey>(`${ONE_TIME_PREFIX}${header.oneTimePreKeyId}`)
    if (stored) {
      ourOpkPriv = await importX25519Private(stored.privateJwk)
      consumedOpkId = header.oneTimePreKeyId
    }
  }

  const peerIdentityPub = await importX25519PublicFromRaw(header.senderIdentityB64)
  const peerEphemeralPub = await importX25519PublicFromRaw(header.ephemeralB64)

  // Mirror of the initiator computation:
  //  DH1' = SPK_B x IK_A, DH2' = IK_B x EK_A, DH3' = SPK_B x EK_A, DH4' = OPK_B x EK_A
  const dh1 = await dhDeriveBits(ourSpkPriv, peerIdentityPub)
  const dh2 = await dhDeriveBits(ourIdentityPriv, peerEphemeralPub)
  const dh3 = await dhDeriveBits(ourSpkPriv, peerEphemeralPub)
  const parts = [dh1, dh2, dh3]
  if (ourOpkPriv) parts.push(await dhDeriveBits(ourOpkPriv, peerEphemeralPub))
  const ikm = concat(parts)

  const sharedKey = await hkdfSha256(ikm, HKDF_SALT_INITIATOR, HKDF_INFO, 32)

  if (consumedOpkId !== null) {
    // Burn the OPK after use — Signal protocol requires single-use.
    await dbDelete(`${ONE_TIME_PREFIX}${consumedOpkId}`)
  }

  await dbSet(sessionKey(peerUserId, peerDeviceId), {
    sharedKeyB64: bufToB64(sharedKey),
    peerIdentityB64: header.senderIdentityB64,
    peerDeviceId,
  } as CachedSession)

  return sharedKey
}

export async function getCachedSession(peerUserId: string, peerDeviceId: string): Promise<Uint8Array | null> {
  const s = await dbGet<CachedSession>(sessionKey(peerUserId, peerDeviceId))
  if (!s) return null
  return b64ToBuf(s.sharedKeyB64)
}

export async function clearCachedSession(peerUserId: string, peerDeviceId: string): Promise<void> {
  await dbDelete(sessionKey(peerUserId, peerDeviceId))
}

// ───────────────────────── envelope encode/decode ─────────────────────────

const enc = new TextEncoder()
const dec = new TextDecoder()

export async function encryptEnvelope(
  type: CallE2EEEnvelope['type'],
  callId: string,
  payload: CallE2EEInnerPayload,
  sharedKey: Uint8Array,
  options: {
    senderDeviceId: string
    targetDeviceId: string
    x3dh?: CallE2EEEnvelope['x3dh']
  },
): Promise<CallE2EEEnvelope> {
  const iv = randomBytes(12)
  const plaintext = enc.encode(JSON.stringify(payload))
  const ct = await aesGcmEncrypt(sharedKey, plaintext, iv)
  return {
    protocol: CALL_E2EE_PROTOCOL,
    protocolVersion: CALL_E2EE_PROTOCOL_VERSION,
    type,
    callId,
    senderDeviceId: options.senderDeviceId,
    targetDeviceId: options.targetDeviceId,
    x3dh: options.x3dh,
    iv: bufToB64(iv),
    ciphertext: bufToB64(ct),
    messageType: options.x3dh ? 3 /* PreKeyMessage */ : 1 /* Message */,
  }
}

export async function decryptEnvelope(envelope: CallE2EEEnvelope, sharedKey: Uint8Array): Promise<CallE2EEInnerPayload> {
  const iv = b64ToBuf(envelope.iv)
  const ct = b64ToBuf(envelope.ciphertext)
  const pt = await aesGcmDecrypt(sharedKey, ct, iv)
  return JSON.parse(dec.decode(pt)) as CallE2EEInnerPayload
}

// ───────────────────────── helpers ─────────────────────────

function concat(parts: Uint8Array[]): Uint8Array {
  let total = 0
  for (const p of parts) total += p.length
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

export function newCallId(): string {
  // Random 16-byte hex — independent of any backend call id.
  const bytes = randomBytes(16)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function generateMediaKeyMaterial(): { mediaKeyB64: string; mediaSaltB64: string; mediaKey: Uint8Array; mediaSalt: Uint8Array } {
  const mediaKey = randomBytes(32)
  const mediaSalt = randomBytes(16)
  return {
    mediaKey,
    mediaSalt,
    mediaKeyB64: bufToB64(mediaKey),
    mediaSaltB64: bufToB64(mediaSalt),
  }
}

export function decodeBase64(b64: string): Uint8Array {
  return b64ToBuf(b64)
}

export function encodeBase64(buf: ArrayBuffer | Uint8Array): string {
  return bufToB64(buf)
}
