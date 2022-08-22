import { get } from 'https'
import { createVerify } from 'crypto'
import type { IncomingMessage } from 'http'

export type tokenInput = {
  publicKeyUrl: string,
  timestamp: number,
  salt: string
  playerId: string
  bundleId: string
  signature: string
}

const cache = new Map<string, string>()

export class SignatureValidationError extends Error {
  constructor(message:string) {
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

export async function getAppleCertificate (url: URL) {
  if (!url.host.endsWith('.apple.com')) {
    throw new SignatureValidationError('Invalid publicKeyUrl: host should be apple.com')
  }
  if (url.protocol !== 'https:') {
    throw new SignatureValidationError(
      'Invalid publicKeyUrl: should use https'
    )
  }

  const cached = cache.get(url+'')
  if (cached)
    return cached

  const [buffer, result] = await new Promise<[Buffer, IncomingMessage]>(resolve => {
    get(url, (res) => {

      if (res.statusCode !== 200)
        throw new SignatureValidationError(`Request http status: ${res.statusCode} ${res.statusMessage}`)

      let chunks:any[] = []

      res.on('data', chunk => chunks.push(chunk) )
      res.on('end', () => resolve([
        Buffer.concat(chunks), res]
      ))
    })
    .on('error', (e) => {
      throw new SignatureValidationError(`getAppleCertificate: ${e.message}`)
    })
  })
  const b64 = buffer.toString('base64')
  const publicKey = convertX509CertToPEM(b64)

  if (result.headers['cache-control']) {
    // if there's a cache-control header
    const expireSec = result.headers['cache-control'].match(/max-age=([0-9]+)/)
    // console.log(expireSec)
    const parsed = (typeof expireSec?.[1] === 'string') ? parseInt(expireSec[1], 10) * 1000 : 0
    // check parsed for falsy value, eg. null or zero
    if (parsed > 0) {
      // if we got max-age
      cache.set(url.toString(), publicKey) //[url] = publicKey // save in cache
      // we'll expire the cache entry later, as per max-age
      setTimeout(() => cache.delete(url.toString()), parsed).unref()
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

export async function verify (idToken: tokenInput):Promise<boolean> {
  const url = new URL(idToken.publicKeyUrl)
  const publicKey = await getAppleCertificate(url)
  return verifySignature(publicKey, idToken)
}

