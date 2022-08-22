"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.verifySignature = exports.convertTimestampToBigEndian = exports.getAppleCertificate = exports.convertX509CertToPEM = exports.SignatureValidationError = void 0;
const https_1 = require("https");
const crypto_1 = require("crypto");
const cache = new Map();
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
    const cached = cache.get(url + '');
    if (cached)
        return cached;
    const [buffer, result] = await new Promise(resolve => {
        (0, https_1.get)(url, (res) => {
            if (res.statusCode !== 200)
                throw new SignatureValidationError(`Request http status: ${res.statusCode} ${res.statusMessage}`);
            let chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve([
                Buffer.concat(chunks), res
            ]));
        })
            .on('error', (e) => {
            throw new SignatureValidationError(`getAppleCertificate: ${e.message}`);
        });
    });
    const b64 = buffer.toString('base64');
    const publicKey = convertX509CertToPEM(b64);
    if (result.headers['cache-control']) {
        // if there's a cache-control header
        const expireSec = result.headers['cache-control'].match(/max-age=([0-9]+)/);
        // console.log(expireSec)
        const parsed = (typeof expireSec?.[1] === 'string') ? parseInt(expireSec[1], 10) * 1000 : 0;
        // check parsed for falsy value, eg. null or zero
        if (parsed > 0) {
            // if we got max-age
            cache.set(url.toString(), publicKey); //[url] = publicKey // save in cache
            // we'll expire the cache entry later, as per max-age
            setTimeout(() => cache.delete(url.toString()), parsed).unref();
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
