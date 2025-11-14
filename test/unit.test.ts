import nock from 'nock'
import { describe, it } from 'node:test'
import { _cache, assertValid, convertTimestampToBigEndian, convertX509CertToPEM, verify } from '../src/main.ts'
import { ok } from 'node:assert'
import { equal, fail } from 'node:assert/strict'
import { mockToken, pkPath, } from './helpers.ts'
import { randomBytes } from 'node:crypto'

describe('assertions in runtime', () => {
  it('should fail if domain is not apple', function () {
    const token = mockToken()
    token.publicKey = token.publicKey.replace('apple', 'microsoft')
    try {
      assertValid(token)
      fail()
    }
    catch (e) {
      ok(e instanceof Error)
    }
  });

})

describe('http mocked', () => {
  it('should succeed to verify apple game center identity', async function () {
    nock('https://valid.apple.com')
      .get('/public/public.cer')
      .replyWithFile(200, pkPath)

    const token = mockToken()
    const isValid = await verify(token)
    equal(isValid, true)
  })

  it('should fail on http', async function () {
    nock('http://valid.apple.com')
      .get('/public/public.cer')
      .replyWithFile(200, pkPath)

    equal((await fetch('http://valid.apple.com/public/public.cer')).status, 200)

    const token = mockToken()
    token.publicKey = token.publicKey.replace('https', 'http')
    await verify(token)
      .then(() => fail('should have thrown'))
      .catch(err => {
        ok(err instanceof Error)
        ok((err+'').includes('not supported'), `${err}`)
      })
  });

  it('should fail on none-200 responses', async function () {
    nock('https://valid.apple.com')
      .get('/badrequest')
      .reply(404, '')

    const token = mockToken()
    token.publicKey = 'https://valid.apple.com/badrequest'

    await verify(token)
      .then(() => fail('should have thrown'))
      .catch(err => {
        ok(err instanceof Error)
        ok((err+'').includes('getHttpCached:'), `${err}`)
      })
  });

  it('should set caching by max-age', async function () {
    const t0 = Date.now()
    const maxAge = 300
    nock('https://valid.apple.com')
      .get('/public/public.cer')
      .replyWithFile(200, pkPath, {
        'Cache-Control': 'max-age='+maxAge
      })

    await verify(mockToken())
    const key = 'https://valid.apple.com/public/public.cer'
    ok(_cache[key]!.expires > t0)
    ok(_cache[key]!.expires < Date.now() + (maxAge*1000))

  });

  // test http max-age logic
})

describe('happy paths', () => {
  it('should convert to PEM', function () {
    const b64 = randomBytes(100).toString('base64')
    const pem = convertX509CertToPEM(b64)

    const pemPreFix = '-----BEGIN CERTIFICATE-----'
    const pemPostFix = '-----END CERTIFICATE-----'
    ok(pem.startsWith(pemPreFix))
    ok(pem.endsWith(pemPostFix))
    const extractedB64 = pem
      .replace(pemPreFix, '')
      .replace(pemPostFix,'')
      .replace(/\s+/g, '')
    equal(extractedB64, b64)
  })

  it('converts number with convertTimestampToBigEndian', function () {
    ok(convertTimestampToBigEndian(1615458137079))
    ok(!Number.isNaN(convertTimestampToBigEndian(1615458137079)))
  })

  it('should assert idToken',  function () {
    assertValid({
      publicKey: "https://static.gc.apple.com/public-key/gc-prod-5.cer",
      timestamp: 1615458137079,
      signature: "HpC8l7Uj+UaTxAZvxYsrQjYXU1lxNFzteX5iVqrnVJTVWlWvf9nH66NvKDyw8zjVdtNUQFOzJjYHnWsWQbanqHKRhbP/uVh/uNKJBpAe56/3QKSjtMkpdY32TNgWmXE219ve/isOk9MSRozowO1kEJ60X8TcVglKmoTyXFA4Vo02i7RvpLJWNLvu/Sk+BIlpt54OX1qE+hgjVYiAFKMPGdfaHlIwNwtR5JgrlpwBPOdYL8lG526v6Fw6yraGqUyeQGUbdQ6Yi3V+YN0t6BOVArtyNKGaKIKmaCfS1C3NA7ntGfM0u/KnbDEACDs8dA4skCXivHZySIEFsaZprW8ymw==",
      salt: "9Rmrxw==",
      bundleId: "net.triband.tricloud-test1",
      playerId: 'teamPlayerID',
    })
  })
})

