import { join } from 'node:path'
import { convertTimestampToBigEndian, type idToken } from '../src/main.ts'
import { readFileSync } from 'node:fs'
import { createSign } from 'node:crypto'

export const privateKey = readFileSync(join(import.meta.dirname, 'fixtures/private.pem'), 'utf-8')

export function addSignature (payload: idToken) {
  const signer = createSign('sha256')
  signer.update(payload.playerId, 'utf8')
  signer.update(payload.bundleId, 'utf8')
  signer.update(convertTimestampToBigEndian(payload.timestamp))
  signer.update(payload.salt, 'base64')
  payload.signature = signer.sign(privateKey, 'base64')
}

export const pkPath = join(import.meta.dirname, '/fixtures/public.der')

export function mockToken () {
  const token: idToken = {
    publicKey: 'https://valid.apple.com/public/public.cer',
    timestamp: 1460981421303,
    salt: 'saltST==',
    playerId: 'G:1111111',
    bundleId: 'com.valid.app',
    signature: '',
  }
  addSignature(token)
  return token
}