import {get} from 'node:https'
import { createVerify } from 'node:crypto'
import { ok } from 'node:assert'

export type idToken = {
  playerId: string
  bundleId: string
  timestamp: number
  salt: string
  signature: string
  publicKey: string
}

type cacheEntry = {data: string, expires: number}
const cache:NodeJS.Dict<cacheEntry> = {} // (publicKey -> cert) cache

export function convertX509CertToPEM (X509Cert:string) {
  const pemPreFix = '-----BEGIN CERTIFICATE-----\n'
  const pemPostFix = '-----END CERTIFICATE-----'

  const base64 = X509Cert
  const certBody:null|string = base64.match(/.{0,64}/g)?.join('\n')

  return pemPreFix + certBody + pemPostFix
}

export async function getHttpCached(url:string):Promise<string> {
  if (cache[url]?.expires > Date.now())
    return cache[url].data

  return new Promise<string>((resolve, reject) =>
    get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`getHttpCached: ${url} responded ${res.statusCode}, expected 200.`))
      }

      const httpMaxAgeMs = parseInt(res.headers['cache-control']?.match(/max-age=([0-9]+)/)?.[1] as string) * 1000

      const cacheEntry:cacheEntry = {
        data: '',
        expires: Date.now() + httpMaxAgeMs
      }

      res.on('error', reject)
        .on('data', (chunk) => (cacheEntry.data += chunk.toString('base64')))
        .on('end', () => {
          cache[url] = cacheEntry
          resolve(cacheEntry.data)
        })
    })
  )
}

export function convertTimestampToBigEndian (timestamp:number) {
  // The timestamp parameter in Big-Endian UInt-64 format
  const buffer = Buffer.alloc(8)
  buffer.fill(0)

  const high = ~~(timestamp / 0xffffffff)
  const low = timestamp % (0xffffffff + 0x1)

  buffer.writeUInt32BE(parseInt(high as any, 10), 0)
  buffer.writeUInt32BE(parseInt(low as any, 10), 4)

  return buffer
}

export function verifyIdToken(publicKeyPEM:string, idToken:idToken):boolean {
  const verifier = createVerify('sha256')
  verifier.update(idToken.playerId, 'utf8')
  verifier.update(idToken.bundleId, 'utf8')
  verifier.update(convertTimestampToBigEndian(idToken.timestamp))
  verifier.update(idToken.salt, 'base64')

  return verifier.verify(publicKeyPEM, idToken.signature, 'base64')
}

export function assertValid(input:any|idToken):idToken {
  ok(input.bundleId && input.playerId && input.publicKey && input.salt && input.timestamp && input.signature, 'falsy data found')

  const url = new URL(input.publicKey)
  ok(url.protocol == 'https:' && url.host.endsWith('.apple.com'))

  return input as idToken
}

export async function verify (idToken:idToken) {
  const x509Cert = await getHttpCached(idToken.publicKey)
  const pem = convertX509CertToPEM(x509Cert)
  return verifyIdToken(pem, idToken)
}
