/*
global toString
 */
'use strict';

var assert = require('assert');
var crypto = require('crypto');
var fs = require('fs');
var verifier = require('../src/main.js');
var nock = require('nock');

function calculateSignature(payload) {
  var privateKey = fs.readFileSync('./test/fixtures/private.pem', 'utf-8');
  var signer = crypto.createSign('sha256');
  signer.update(payload.playerId, 'utf8');
  signer.update(payload.bundleId, 'utf8');
  signer.update(verifier.convertTimestampToBigEndian(payload.timestamp));
  signer.update(payload.salt, 'base64');

  var signature = signer.sign(privateKey, 'base64');
  return signature;
}

describe('verifying gameCenter identity', function () {

});
