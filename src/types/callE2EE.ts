/** DTOs and types for the audio/video call E2EE Signal-style key system. */

export interface SignedPreKeyDto {
  keyId: number
  publicKey: string // base64
  signature: string // base64
}

export interface OneTimePreKeyDto {
  keyId: number
  publicKey: string // base64
}

export interface RegisterCallBundleRequest {
  deviceId: string
  registrationId: number
  identityKey: string // base64 X25519 public
  signedPreKey: SignedPreKeyDto
  oneTimePreKeys: OneTimePreKeyDto[]
  replaceExistingOneTimePreKeys?: boolean
}

export interface CallDeviceStatus {
  userId: string
  deviceId: string
  isRegistered: boolean
  registrationId?: number
  signedPreKeyId?: number
  oneTimePreKeysAvailable: number
  lastRotatedAtUtc?: string
  protocolVersion?: string
  algorithm?: string
}

export interface FetchPeerBundleRequest {
  deviceId?: string
  consumeOneTimePreKey?: boolean
  callId?: string
}

export interface PeerBundleResponse {
  userId: string
  deviceId: string
  registrationId: number
  identityKey: string // base64
  signedPreKey: SignedPreKeyDto
  oneTimePreKey: OneTimePreKeyDto | null
  oneTimePreKeysRemaining: number
  protocol: string
  protocolVersion: string
  algorithm: string
  fetchedAtUtc: string
}

/** Outer envelope sent over SignalR. The `ciphertext` is opaque to the server. */
export interface CallE2EEEnvelope {
  protocol: 'signal' | 'signal-protocol'
  protocolVersion: string
  type: 'call-offer' | 'call-answer' | 'media-rekey' | 'call-control'
  callId: string
  senderDeviceId: string
  targetDeviceId: string
  /** For the initial X3DH message: includes ephemeral key + used pre-key ids. */
  x3dh?: {
    identityKey: string // base64 sender IK pub
    ephemeralKey: string // base64 EK_A pub
    signedPreKeyId: number
    oneTimePreKeyId: number | null
    registrationId: number
  }
  iv: string // base64 12 bytes
  ciphertext: string // base64 AES-GCM(payload)
  messageType?: number
}

/** Inner payload — encrypted by AES-GCM, never seen by backend. */
export interface CallE2EEInnerPayload {
  callId: string
  conversationId: string
  senderUserId: string
  senderDeviceId: string
  targetUserId: string
  targetDeviceId: string
  mediaKey: string // base64 32 bytes
  mediaSalt: string // base64 16 bytes
  epoch: number
  createdAtUtc: string
}

/** Echoed by SignalR call events. */
export interface IncomingCallEncryption {
  protocol?: string
  protocolVersion?: string
  type?: string
  callId?: string
  senderDeviceId?: string
  targetDeviceId?: string
  iv?: string
  ciphertext?: string
  x3dh?: CallE2EEEnvelope['x3dh']
  [key: string]: unknown
}
