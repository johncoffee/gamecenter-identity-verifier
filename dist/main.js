"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.verifySignature = exports.convertTimestampToBigEndian = exports.getAppleCertificate = exports.convertX509CertToPEM = exports.SignatureValidationError = void 0;
const crypto_1 = require("crypto");
const node_fetch_1 = __importDefault(require("node-fetch"));
const memCache = new Map();
class SignatureValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SignatureValidationError';
    }
}
exports.SignatureValidationError = SignatureValidationError;
function convertX509CertToPEM(base64) {
    const pemPreFix = '-----BEGIN CERTIFICATE-----\n';
    const pemPostFix = '-----END CERTIFICATE-----';
    const certBody = base64.match(/.{0,64}/g)?.join('\n');
    return pemPreFix + certBody + pemPostFix;
}
exports.convertX509CertToPEM = convertX509CertToPEM;
async function getAppleCertificate(url) {
    if (!url.host.endsWith('.apple.com')) {
        throw new SignatureValidationError('Invalid publicKeyUrl: host should be apple.com');
    }
    if (url.protocol !== 'https:') {
        throw new SignatureValidationError('Invalid publicKeyUrl: should use https');
    }
    const cached = memCache.get(url + '');
    if (cached)
        return cached;
    const res = await (0, node_fetch_1.default)(url)
        .catch(err => {
        throw new SignatureValidationError(`getAppleCertificate: ${err.message}`);
    });
    if (res.status !== 200)
        throw new SignatureValidationError(`getAppleCertificate: ${res.status} ${res.statusText}`);
    const buffer = await res.buffer();
    if (buffer.length === 0)
        throw new SignatureValidationError(`Empty response from ${url} - ${res.status} ${res.statusText}`);
    const b64 = buffer.toString('base64');
    const publicKey = convertX509CertToPEM(b64);
    const cacheHeader = res.headers.get('cache-control');
    if (cacheHeader) {
        // if there's a cache-control header
        const maxAgeSec = cacheHeader.match(/max-age=([0-9]+)/);
        // subtract a margin of 5s from max Age
        const marginMs = 5000;
        const parsed = (typeof maxAgeSec?.[1] === 'string') ? parseInt(maxAgeSec[1], 10) * 1000 - marginMs : 0;
        // check parsed for falsy value, eg. null or zero
        if (parsed > 0) {
            // if we got max-age
            memCache.set(url.toString(), publicKey);
            // we'll expire the cache entry later, as per max-age
            setTimeout(() => memCache.delete(url.toString()), parsed).unref();
        }
    }
    return publicKey;
}
exports.getAppleCertificate = getAppleCertificate;
function convertTimestampToBigEndian(timestamp) {
    // The timestamp parameter in Big-Endian UInt-64 format
    const buffer = Buffer.alloc(8);
    buffer.fill(0);
    const high = ~~(timestamp / 0xffffffff);
    const low = timestamp % (0xffffffff + 0x1);
    buffer.writeUInt32BE(parseInt(high, 10), 0);
    buffer.writeUInt32BE(parseInt(low, 10), 4);
    return buffer;
}
exports.convertTimestampToBigEndian = convertTimestampToBigEndian;
function verifySignature(publicKey, idToken) {
    const verifier = (0, crypto_1.createVerify)('sha256');
    verifier.update(idToken.playerId, 'utf8');
    verifier.update(idToken.bundleId, 'utf8');
    verifier.update(convertTimestampToBigEndian(idToken.timestamp));
    verifier.update(idToken.salt, 'base64');
    return verifier.verify(publicKey, idToken.signature, 'base64');
}
exports.verifySignature = verifySignature;
async function verify(idToken) {
    const url = new URL(idToken.publicKeyUrl);
    const publicKey = await getAppleCertificate(url);
    return verifySignature(publicKey, idToken);
}
exports.verify = verify;
