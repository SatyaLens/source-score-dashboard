const assert = require('assert');
const path = require('path');

const { parseJwtPayload, getTokenExpiresAt } = require(path.join(__dirname, '..', 'auth.js'));

function b64url(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken(payload) {
    return `h.${b64url(payload)}.s`;
}

// Test parseJwtPayload with standard exp
const p1 = parseJwtPayload(makeToken({ exp: 1710000000, foo: 'bar' }));
assert.strictEqual(p1.exp, 1710000000, 'exp should be parsed as number');

// Test getTokenExpiresAt converts seconds -> milliseconds
const ms1 = getTokenExpiresAt(makeToken({ exp: 1710000000 }));
assert.strictEqual(ms1, 1710000000 * 1000, 'exp seconds should convert to ms');

// Test accepts numeric string ExpiresAt
const numericStr = String(Date.now() + 60000);
const ms2 = getTokenExpiresAt(makeToken({ ExpiresAt: numericStr }));
assert.strictEqual(ms2, Number(numericStr), 'numeric string expiresAt should parse to number');

// Test accepts ISO date string
const iso = new Date(Date.now() + 120000).toISOString();
const ms3 = getTokenExpiresAt(makeToken({ expiresAt: iso }));
assert.strictEqual(ms3, Date.parse(iso), 'ISO date string should parse');

console.log('All auth helper tests passed');
