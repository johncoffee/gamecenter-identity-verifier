/*
global toString
 */
'use strict'

var assert = require('assert')
var verifier = require('../dist/main')

function isError (error) {
  return toString.call(error) === '[object Error]'
}

// a real token is used to check caching behavior
// but sharing it should have no security consequences
var testToken = {
  playerId: 'G:1965586982',
  publicKeyUrl: 'https://static.gc.apple.com/public-key/gc-prod-4.cer',
  timestamp: 1565257031287,
  signature: 'uqLBTr9Uex8zCpc1UQ1MIDMitb+HUat2Mah4Kw6AVLSGe0gGNJXlih2i5X+0Z' +
    'wVY0S9zY2NHWi2gFjmhjt\/4kxWGMkupqXX5H\/qhE2m7hzox6lZJpH98ZEUbouWRfZX2ZhU' +
    'lCkAX09oRNi7fI7mWL1\/o88MaI\/y6k6tLr14JTzmlxgdyhw+QRLxRPA6NuvUlRSJpyJ4aG' +
    'tNH5\/wHdKQWL8nUnFYiYmaY8R7IjzNxPfy8UJTUWmeZvMSgND4u8EjADPsz7ZtZyWAPi8kY' +
    'cAb6M8k0jwLD3vrYCB8XXyO2RQb/FY2TM4zJuI7PzLlvvgOJXbbfVtHx7Evnm5NYoyzgzw==',
  salt: 'DzqqrQ==',
  bundleId: 'cloud.xtralife.gamecenterauth'
}

describe('caching test', function () {

  it('should take less time running subsequent runs, when caching is working (assumption: network latency allows for this test to run)', async function () {

    const t0 = Date.now()
    await verifier.verify(testToken)
    const firstDelay = Date.now() - t0
    console.log(`First run time ${firstDelay}ms`)
    this.timeout(firstDelay * 2)

    const t1 = Date.now()
    let runs = 0
    const runsTarget = 50

    console.log(`Caching should allow running at least ${runsTarget} times in ${firstDelay}ms when caching`)
    while (runs < runsTarget) {
      await verifier.verify(testToken)
      runs++
    }

    console.log(`Ran ${runs} times in ${Date.now() - t1}ms, after caching pub key`)
    assert(runs >= runsTarget, `should be able to run ${runsTarget} times when caching`)
  })
})

