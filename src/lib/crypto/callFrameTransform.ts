/**
 * WebRTC media-frame encryption using the Insertable Streams API
 * (`RTCRtpSender.createEncodedStreams` / `RTCRtpReceiver.createEncodedStreams`).
 *
 * Frame layout (sender):
 *   [unencrypted RTP header copy: N bytes] [12-byte iv-suffix] [encrypted body || AES-GCM tag]
 *
 * For simplicity we leave the first few bytes of the encoded frame unencrypted
 * (these are the codec headers that need to remain visible for routing/SFU);
 * the rest of the frame plus an AES-GCM auth tag is encrypted.
 *
 * IV construction:
 *   12-byte iv = 4-byte salt-prefix XOR 4 bytes from mediaSalt || 8-byte big-endian counter
 *   The 12-byte iv is appended to the frame so the receiver can reconstruct it
 *   (this is the standard SFrame trick without the full SFrame header).
 *
 * Both sides derive an AES-GCM key from `mediaKey` via HKDF(mediaKey, mediaSalt, "deviny-frame").
 */

const HEADER_BYTES_BY_KIND: Record<'audio' | 'video', number> = { audio: 1, video: 10 }
const IV_LENGTH = 12
const TAG_LENGTH = 16 // AES-GCM tag is 16 bytes

function bufferSource(u8: Uint8Array): BufferSource {
  const buf = u8.buffer as ArrayBuffer
  return buf.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
}

async function deriveFrameKey(mediaKey: Uint8Array, mediaSalt: Uint8Array): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey('raw', bufferSource(mediaKey), 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: bufferSource(mediaSalt),
      info: new TextEncoder().encode('deviny-frame-v1'),
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function isInsertableStreamsSupported(): boolean {
  if (typeof RTCRtpSender === 'undefined' || typeof RTCRtpReceiver === 'undefined') return false
  // Chromium-based (createEncodedStreams) or new transform API
  return (
    typeof (RTCRtpSender.prototype as unknown as { createEncodedStreams?: unknown }).createEncodedStreams === 'function' ||
    typeof (RTCRtpSender.prototype as unknown as { transform?: unknown }).transform !== 'undefined'
  )
}

export interface FrameCipherHandles {
  enable(): Promise<void>
  rotate(mediaKey: Uint8Array, mediaSalt: Uint8Array): Promise<void>
  disable(): void
}

export interface CreateFrameCipherOptions {
  pc: RTCPeerConnection
  mediaKey: Uint8Array
  mediaSalt: Uint8Array
  /** Logging tag. */
  label?: string
}

export function isFrameEncryptionSupported(): boolean {
  return isInsertableStreamsSupported()
}

/**
 * Installs per-frame AES-GCM encryption on every sender and per-frame
 * decryption on every receiver of the given RTCPeerConnection. Idempotent.
 */
export function attachFrameCipher(opts: CreateFrameCipherOptions): FrameCipherHandles {
  let frameKey: CryptoKey | null = null
  let cancelled = false
  let sendCounter = 0n
  const label = opts.label ?? 'call'

  const attached = new WeakSet<RTCRtpSender | RTCRtpReceiver>()

  async function ensureKey(mediaKey: Uint8Array, mediaSalt: Uint8Array) {
    frameKey = await deriveFrameKey(mediaKey, mediaSalt)
  }

  function encodeCounter(value: bigint): Uint8Array {
    const out = new Uint8Array(8)
    const dv = new DataView(out.buffer)
    dv.setBigUint64(0, value, false)
    return out
  }

  function buildIv(counter: Uint8Array, salt: Uint8Array): Uint8Array {
    const iv = new Uint8Array(IV_LENGTH)
    // first 4 bytes come from the media salt (constant per call)
    iv.set(salt.subarray(0, 4), 0)
    // next 8 bytes are the monotonically increasing counter
    iv.set(counter, 4)
    return iv
  }

  async function encryptChunk(chunk: RTCEncodedAudioFrame | RTCEncodedVideoFrame, kind: 'audio' | 'video') {
    if (!frameKey || cancelled) return chunk
    const data = new Uint8Array(chunk.data)
    const headerBytes = Math.min(HEADER_BYTES_BY_KIND[kind], data.length)
    const header = data.subarray(0, headerBytes)
    const body = data.subarray(headerBytes)

    const counter = encodeCounter(sendCounter++)
    const iv = buildIv(counter, opts.mediaSalt)
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: bufferSource(iv) }, frameKey, bufferSource(body)))

    // header || ciphertext+tag || counter(8)
    const out = new Uint8Array(header.length + ct.length + 8)
    out.set(header, 0)
    out.set(ct, header.length)
    out.set(counter, header.length + ct.length)
    chunk.data = out.buffer
    return chunk
  }

  async function decryptChunk(chunk: RTCEncodedAudioFrame | RTCEncodedVideoFrame, kind: 'audio' | 'video') {
    if (!frameKey || cancelled) return chunk
    const data = new Uint8Array(chunk.data)
    if (data.length < HEADER_BYTES_BY_KIND[kind] + TAG_LENGTH + 8) return chunk
    const headerBytes = HEADER_BYTES_BY_KIND[kind]
    const header = data.subarray(0, headerBytes)
    const counter = data.subarray(data.length - 8)
    const body = data.subarray(headerBytes, data.length - 8)
    const iv = buildIv(counter, opts.mediaSalt)

    try {
      const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bufferSource(iv) }, frameKey, bufferSource(body)))
      const out = new Uint8Array(header.length + pt.length)
      out.set(header, 0)
      out.set(pt, header.length)
      chunk.data = out.buffer
    } catch (err) {
      console.warn(`[${label}] frame decrypt failed; dropping`, err)
      chunk.data = new ArrayBuffer(0)
    }
    return chunk
  }

  function pipe(sender: RTCRtpSender | RTCRtpReceiver, direction: 'encrypt' | 'decrypt') {
    if (attached.has(sender)) return
    const kind = (sender.track?.kind ?? 'audio') as 'audio' | 'video'
    type EncStreams = { readable: ReadableStream<RTCEncodedAudioFrame | RTCEncodedVideoFrame>; writable: WritableStream<RTCEncodedAudioFrame | RTCEncodedVideoFrame> }
    const create = (sender as unknown as { createEncodedStreams?: () => EncStreams }).createEncodedStreams
    if (typeof create !== 'function') return
    const streams = create.call(sender)
    const transform = new TransformStream<RTCEncodedAudioFrame | RTCEncodedVideoFrame, RTCEncodedAudioFrame | RTCEncodedVideoFrame>({
      async transform(chunk, controller) {
        const out = direction === 'encrypt' ? await encryptChunk(chunk, kind) : await decryptChunk(chunk, kind)
        controller.enqueue(out)
      },
    })
    streams.readable.pipeThrough(transform).pipeTo(streams.writable).catch(err => {
      if (!cancelled) console.warn(`[${label}] frame stream pipe error`, err)
    })
    attached.add(sender)
  }

  function attachAll() {
    if (!isInsertableStreamsSupported()) return
    opts.pc.getSenders().forEach(s => pipe(s, 'encrypt'))
    opts.pc.getReceivers().forEach(r => pipe(r, 'decrypt'))
  }

  // Pick up senders/receivers added later (e.g. when remote tracks arrive).
  opts.pc.addEventListener('track', () => attachAll())
  opts.pc.addEventListener('negotiationneeded', () => attachAll())

  return {
    async enable() {
      await ensureKey(opts.mediaKey, opts.mediaSalt)
      attachAll()
    },
    async rotate(mediaKey: Uint8Array, mediaSalt: Uint8Array) {
      opts.mediaKey = mediaKey
      opts.mediaSalt = mediaSalt
      await ensureKey(mediaKey, mediaSalt)
      sendCounter = 0n
    },
    disable() {
      cancelled = true
      frameKey = null
    },
  }
}

// Minimal type shims for browsers that ship the API.
declare global {
  interface RTCEncodedAudioFrame { data: ArrayBuffer }
  interface RTCEncodedVideoFrame { data: ArrayBuffer }
}
