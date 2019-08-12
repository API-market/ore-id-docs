<img src="https://en.gravatar.com/userimage/137186280/281fbdfb8df941e941b3ad68c925c3c7.png" width="70" height="70">

# ORE ID - OAuth for Blockchain



ORE ID allows anyone to access your dApp with one-click sign up and blockchain account creation - using a login flow that they are already familiar with. ORE ID supports Google, Facebook, Github, Linkedin, Twitter, Twitch, and practically any other OAuth-enabled login provider.

With ORE ID, users of your web or mobile app get an on-chain account upon first sign-in. Their private key is encrypted with a PIN of their choosing and stored for them so they don't have to remember their blockchain accounts or keys.

ORE ID also serves as a blockchain wallet for your your users. Your app can request a user to sign a transaction using their PIN to decrypt their keys.

ORE ID is the easiest way to add support for Scatter, Ledger Nano S, Metro and every other EOS wallet that supports the new [Transit API](https://github.com/eosnewyork/eos-transit) standard or [UAL](https://github.com/EOSIO/universal-authenticator-library). Just add our eos-auth library and your app will instantly support these popular wallets.

ORE ID removes the friction between your app and your future users. 

<img src="./docs/images/OREID-GitHub-diagram-01.png">

# Quickstart Guide

To run sample code:

- You'll need your App ID and API Key - you get them when you register your app with ORE ID
- Populate .env file in root of project directory with your appId and apiKey (it will start with keys for a demo app)

    ```
    cd examples/react
    npm install
    npm start
    ```

You can find other example apps including React Native, in the `/examples` folder.

# Usage


## To use in your app

### Step 1 - Register your app and logo

Apply [here](https://aikon.com/ore-id) for early access 

### Step 2 - Install library

For Javascript apps, install the npm client module

```
npm install eos-auth
```

### Step 3 - Call Login

Call login and specify a provider (facebook, scatter, etc.) After login, your app will receive the user's blockchain account name (which maps to public/private keys). The user's info will automatically be stored in local state (cookie, etc.) and will be restored the next time the user uses your app. You can also call the user endpoint at any time to get the user's basic identity info (e.g. name, email, avatar picture)

### Step 4 - Call Sign

When your app needs the user to sign a blockchain transaction, you just specify the chain name (e.g. eos_main) and chain account if you know it. If you don't know which EOS blockchain accounts the user has or in which wallet they are stored, you can call the discover function that will prompt the user to unlock their wallet. Public keys stored in the wallet will be automatically remembered so you can help the user find the right wallet and keys quickly the next time they need to repeat a transaction. Awesome!

### Step 5 - User can view and control account on the blockchain  

The account is a blockchain account that can be easily viewed on the public blockchain using a block explorer.

The user's account's private key can be transferred to his offline wallet when requested.

Search the chain for account details and token balances like this - [http://explorer.openrights.exchange/accounts/1pxnubvyqceu](http://explorer.openrights.exchange/accounts/1pxnubvyqceu)


## Example code
```javascript
//Initialize the library
let oreId = new OreId({ appName:"My App", appId, apiKey, ... })

//Start the OAuth flow by setting browser to URL returned by login
let loginResponse = await oreId.login({provider:'facebook'});
window.location = loginResponse.loginUrl

//Get the user's info given a blockchain account
let userInfo = await oreId.getUserInfoFromApi(account)

//Start the ORE ID signing process
let signResponse = await oreId.sign(signOptions)
window.location = signResponse.signUrl

OR

//Start the signing process using local wallet app
let signResponse = await oreId.sign({provider:'scatter', chainNetwork:'eos_kylin', transaction, ...})
console.log(signResponse.signedTransaction)
```

## Express Middleware

This library includes Express middleware that you can use to simplify handling the callbacks from the ORE ID service. It extracts the results from the /auth and /sign callbacks and attaches info to the request object (e.g. req.user)

```javascript
app.use('/authcallback', authCallbackHandler(oreId) );
```

Take a look at examples/express for a complete example of use.

## Example projects

Refer to the examples folder for the following sample projects

- ReactJS - A simple ReactJS website that includes React Login button component

- React Native - A React Native app that includes a React OAuth flow modal component

- Express Server - A simple Express server that includes the use of middleware to automate handling of callbacks

## Warnings

When integrating with Transit or UAL the providers are interchangeable. You can switch between ual-lynx and transit-lynx but only one is allowed at any given time, attempting to pass in duplicate providers will result in an error. 


[Frequently Asked Questions](https://drive.google.com/open?id=1Nx6qm7z8TQRM8S-onmcP0H--21z-gzYDBVEzzfcgE9g)

[How ORE ID Works](https://docs.google.com/document/d/1n09swvocpR2WkP5iFc_VMrmmlnx3S1j72Zy6yDvcuYw/edit?usp=sharing)

[<img src="./docs/images/eos-transit-logo.png">](https://github.com/eosnewyork/eos-transit)