import { describe, it } from 'node:test'
import { equal, fail } from 'node:assert/strict'
import { assertValid, verify } from '../src/main.ts'
import type { idToken } from '../src/main.ts'
import { ok } from 'node:assert'

const player = {
  'gamePlayerID': 'A:_650ed1e2127d4e11098d1521e3b7d076',
  'teamPlayerID': 'T:_2d60bf58179cc5774b0473446c5ae683'
} as const

const testToken:idToken = {
  publicKey: "https://static.gc.apple.com/public-key/gc-prod-5.cer",
  timestamp: 1615458137079,
  signature: "HpC8l7Uj+UaTxAZvxYsrQjYXU1lxNFzteX5iVqrnVJTVWlWvf9nH66NvKDyw8zjVdtNUQFOzJjYHnWsWQbanqHKRhbP/uVh/uNKJBpAe56/3QKSjtMkpdY32TNgWmXE219ve/isOk9MSRozowO1kEJ60X8TcVglKmoTyXFA4Vo02i7RvpLJWNLvu/Sk+BIlpt54OX1qE+hgjVYiAFKMPGdfaHlIwNwtR5JgrlpwBPOdYL8lG526v6Fw6yraGqUyeQGUbdQ6Yi3V+YN0t6BOVArtyNKGaKIKmaCfS1C3NA7ntGfM0u/KnbDEACDs8dA4skCXivHZySIEFsaZprW8ymw==",
  salt: "9Rmrxw==",
  bundleId: "net.triband.tricloud-test1",
  playerId: player.teamPlayerID,
} as const

describe('caching test', function () {
  it('should take less time for next checks due to caching', async function () {
    ok(assertValid(testToken))

    const times = 1000
    const targetAvgMs = 30
    const timer = setTimeout(() => {
      fail('timed out')
    }, times * targetAvgMs)

    for (let i = 0; i < times; i++) {
      const verified = await verify(testToken)
      equal(verified, true, "expected verification to succeed")
    }

    clearTimeout(timer)
  })
})

