![CircleCI](https://circleci.com/gh/johncoffee/gamecenter-identity-verifier.svg?style=svg)

# gamecenter-identity-verifier

This is library to validate a apple's gamecenter identity of localplayer for consuming it in [node.js][node] backend server.

### Features

- Zero dependencies
- Exporting both ESM and CommonJS
- Testet
- Caching

## Changes

**1.0**

- rewrite in Typescript
- support both CommonJS and ESModules
- develop without `ts-node`

### Release plan

Release v1.0 with both esm and cjs, then create v2.0 that removes cjs, while maintaining a release branch for v1.x. Is this a good idea?

Be conservative with node version support in the the cjs build.   
Be optimistic with node/JS feature usage in the the mjs build. 

## Installation

```shell
npm install gamecenter-identity-verifier
```

## Usage

```typescript
import { assertValid, verify } from 'gamecenter-identity-verifier'

// identity from client.
// Reference:  https://developer.apple.com/library/ios/documentation/GameKit/Reference/GKLocalPlayer_Ref/index.html#//apple_ref/occ/instm/GKLocalPlayer/generateIdentityVerificationSignatureWithCompletionHandler

const identity = {
  publicKeyUrl: 'https://valid.apple.com/public/timeout.cer',
  timestamp: 1460981421303,
  signature: 'PoDwf39DCN464B49jJCU0d9Y0J',
  salt: 'saltST==',
  playerId: 'G:1111111',
  bundleId: 'com.valid.app'
}

assertValid(identity)

await verify(identity)
```

# Development

The [tsconfig.json](tsconfig.json) is fitted for developing without `ts-node`, but
using Node's support for TypeScript (strip-types).


------------------------

## Wishlist

1. Explicitly test and support various runtimes & versions


-----------------------

## Inspired by / links

* build commonsJS and ESModules from Typescript https://blog.mastykarz.nl/create-npm-package-commonjs-esm-typescript/
* apple's api document - https://developer.apple.com/library/ios/documentation/GameKit/Reference/GKLocalPlayer_Ref/index.html#//apple_ref/occ/instm/GKLocalPlayer/generateIdentityVerificationSignatureWithCompletionHandler
* stackoverflow - http://stackoverflow.com/questions/17408729/how-to-authenticate-the-gklocalplayer-on-my-third-party-server

## TypeScript

The distributed code contain typings.

https://devblogs.microsoft.com/typescript/announcing-typescript-5-8-beta/#the---erasablesyntaxonly-option
