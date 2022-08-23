import { createVerify } from 'crypto'
import fetch from 'node-fetch'

export type tokenInput = {
  publicKeyUrl: string,
  timestamp: number,
  salt: string
  playerId: string
  bundleId: string
  signature: string
}

const memCache = new Map<string, string>()

export class SignatureValidationError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'SignatureValidationError'
  }
}

export function convertX509CertToPEM (base64: string) {
  const pemPreFix = '-----BEGIN CERTIFICATE-----\n'
  const pemPostFix = '-----END CERTIFICATE-----'

  const certBody = base64.match(/.{0,64}/g)?.join('\n')

  return pemPreFix + certBody + pemPostFix
}

export async function getAppleCertificate (url: URL): Promise<string> {
  if (!url.host.endsWith('.apple.com')) {
    throw new SignatureValidationError('Invalid publicKeyUrl: host should be apple.com')
  }
  if (url.protocol !== 'https:') {
    throw new SignatureValidationError(
      'Invalid publicKeyUrl: should use https'
    )
  }

  const cached = memCache.get(url + '')
  if (cached)
    return cached

  const res = await fetch(url)
    .catch(err => {
      throw new SignatureValidationError(`getAppleCertificate: ${err.message}`)
    })

  if (res.status !== 200)
    throw new SignatureValidationError(`getAppleCertificate: ${res.status} ${res.statusText}`)

  const buffer: Buffer = await res.buffer()
  if (buffer.length === 0)
    throw new SignatureValidationError(`Empty response from ${url} - ${res.status} ${res.statusText}`)

  const b64 = buffer.toString('base64')
  const publicKey = convertX509CertToPEM(b64)

  const cacheHeader = res.headers.get('cache-control')
  if (cacheHeader) {
    // if there's a cache-control header
    const maxAgeSec = cacheHeader.match(/max-age=([0-9]+)/)
    // console.log(expireSec)
    const parsed = (typeof maxAgeSec?.[1] === 'string') ? parseInt(maxAgeSec[1], 10) * 1000 : 0
    // check parsed for falsy value, eg. null or zero
    if (parsed > 0) {
      // if we got max-age
      memCache.set(url.toString(), publicKey)
      // we'll expire the cache entry later, as per max-age
      setTimeout(() => memCache.delete(url.toString()), parsed).unref()
    }
  }

  return publicKey
}

export function convertTimestampToBigEndian (timestamp: number) {
  // The timestamp parameter in Big-Endian UInt-64 format
  const buffer = Buffer.alloc(8)
  buffer.fill(0)

  const high = ~~(timestamp / 0xffffffff)
  const low = timestamp % (0xffffffff + 0x1)

  buffer.writeUInt32BE(parseInt(high as any, 10), 0)
  buffer.writeUInt32BE(parseInt(low as any, 10), 4)

  return buffer
}

export function verifySignature (publicKey: string, idToken: tokenInput) {
  const verifier = createVerify('sha256')
  verifier.update(idToken.playerId, 'utf8')
  verifier.update(idToken.bundleId, 'utf8')
  verifier.update(convertTimestampToBigEndian(idToken.timestamp))
  verifier.update(idToken.salt, 'base64')

  return verifier.verify(publicKey, idToken.signature, 'base64')
}

export async function verify (idToken: tokenInput): Promise<boolean> {
  const url = new URL(idToken.publicKeyUrl)
  const publicKey = await getAppleCertificate(url)
  return verifySignature(publicKey, idToken)
}

