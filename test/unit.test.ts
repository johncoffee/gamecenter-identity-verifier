import { describe, it } from 'node:test'
import { assertValid, convertTimestampToBigEndian, convertX509CertToPEM } from '../src/main.ts'
import { ok } from 'node:assert'

describe('happy paths', () => {
  it('should convert to PEM', function () {
    const pemPreFix = '-----BEGIN CERTIFICATE-----\n'
    const pemPostFix = '-----END CERTIFICATE-----'

    const pem = convertX509CertToPEM("A".repeat(64))
    pem.startsWith(pemPreFix)
    pem.endsWith(pemPostFix)
  })

  it('converts number with convertTimestampToBigEndian', function () {
    ok(convertTimestampToBigEndian(1615458137079))
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