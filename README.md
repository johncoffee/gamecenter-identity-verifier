![CircleCI](https://circleci.com/gh/johncoffee/node-gamecenter-identity-verifier.svg?style=svg)


## Features of this module

- Zero dependencies
- tested
- written in typescript 
- exporting both ESM and commonjs

# gamecenter-identity-verifier

This is library to validate a apple's gamecenter identity of localplayer for consuming it in [node.js][node] backend server.

## Installation

```bash
npm install gamecenter-identity-verifier --save
```

## Usage

```ts

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


## Inspired by

* build commonsJS and ESModules from Typescript https://blog.mastykarz.nl/create-npm-package-commonjs-esm-typescript/
* apple's api document - https://developer.apple.com/library/ios/documentation/GameKit/Reference/GKLocalPlayer_Ref/index.html#//apple_ref/occ/instm/GKLocalPlayer/generateIdentityVerificationSignatureWithCompletionHandler
* stackoverflow - http://stackoverflow.com/questions/17408729/how-to-authenticate-the-gklocalplayer-on-my-third-party-server

# TypeScript

https://devblogs.microsoft.com/typescript/announcing-typescript-5-8-beta/#the---erasablesyntaxonly-option
