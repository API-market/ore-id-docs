
const dotenv = require('dotenv');
const { OreId } = require('eos-auth');
const { ChainFactory, ChainType} = require('@open-rights-exchange/chainjs')
const {
  EthUnit
} = require('@open-rights-exchange/chainjs/dist/chains/ethereum_1/models')
const {toEthereumPrivateKey } = require('@open-rights-exchange/chainjs/dist/chains/ethereum_1/helpers')
const { ChainActionType, ConfirmType } = require('@open-rights-exchange/chainjs/dist/models')

dotenv.config();

const {
  APP_ID: appId, // Provided when you register your app
  API_KEY:apiKey, // Provided when you register your app
  SERVICE_KEY: serviceKey, // Provided when you register your app
  AUTH_CALLBACK:authCallbackUrl, // The url called by the server when login flow is finished - must match one of the callback strings listed in the App Registration
  SIGN_CALLBACK:signCallbackUrl, // The url called by the server when transaction signing flow is finished - must match one of the callback strings listed in the App Registration
  OREID_URL:oreIdUrl, // HTTPS Address of OREID server
  BACKGROUND_COLOR:backgroundColor, // Background color shown during login flow
  FUNDING_ACCOUNT_ADDRESS: fundingAccount, // ethereum account to fund oreid user wallets
  FUNDING_ACCOUNT_PRIVATE_KEY: fundingAccountPrivateKey
} = process.env;

const ETH_NETWORK = 'eth_ropsten'

const ropstenEndpoints = [
  {
    url: new URL('https://ropsten.infura.io/v3/fc379c787fde4363b91a61a345e3620a'),
  },
]

const ropstenChainOptions = {
  chainName: 'ropsten',
  hardFork: 'istanbul',
}

async function run() {
  /*
  * Initialize oreid
  */
  const oreId = new OreId({ appName:'Test app', appId, apiKey, oreIdUrl, authCallbackUrl, signCallbackUrl, backgroundColor, serviceKey, setBusyCallback:this.setBusyCallback });
  
  /**
   * Create new oreid user
   * */
  // set the email field to a new email to generate a new oreid user.
  const custodialNewAccountParams = { accountType: "native", email:  "testemail@gmail.com", name: "Surabhi Lodha", picture: "", phone: "+1213357112", userName: "sulo", userPassword: "1993"}
  const newUser = await oreId.custodialNewAccount(custodialNewAccountParams)
  const { accountName, processId } = newUser
  const userInfo = await oreId.getUserInfoFromApi(accountName, processId)
  console.log("User info: %o", userInfo)
  const { chainAccount  } = userInfo.permissions.find((perm) => perm.chainNetwork === ETH_NETWORK)
  console.log("User's ethereum address: %o", chainAccount)

  /************************************************************************************************************************** */

  /**
   * Send eth from funding account to oreid user using chainjs
   */
  const ropsten = new ChainFactory().create(ChainType.EthereumV1, ropstenEndpoints, {
    chainForkType: ropstenChainOptions,
  })
  // connect to the chain
  await ropsten.connect()
  console.log("Connected to ethereum ropsten network")

  // construct eth transfer transaction 
  const transaction = await ropsten.new.Transaction()
  transaction.actions = [{
      from: fundingAccount,
      to: chainAccount,   
      value: 100000000000 // wei amount to send to oreid user
  }]

  // // prepare the transaction to sign
  await transaction.prepareToBeSigned()
  await transaction.validate()
  // send the transaction  to transfer eth to user wallet 
  await transaction.sign([toEthereumPrivateKey(fundingAccountPrivateKey)])
  console.log("Send test eth to oreid user wallet and confirm the transaction on the ropsten network")
  const transactionResponse = await transaction.send(ConfirmType.After001)
  console.log('send response: %o', transactionResponse)

  /************************************************************************************************************************** */
  
  /** 
   * Send  eth out of oreid user wallet 
   * This transaction will take few minutes to confirm
   * */
  const userTransaction = {
    actions: [{
      from: chainAccount,
      to: fundingAccount,
      value: 1 // wei amount to send out of oreid user wallet
  }]}
  
  const sendTransactionParams = {account:accountName,
  broadcast: true,
  returnSignedTransaction: true,
  chainAccount,
  chainNetwork: 'eth_ropsten',
  processId,
  transaction: userTransaction,
  userPassword: '1993', // dummy user password
  provider: 'custodial',
  callbackUrl: ''
  }
  const signedUserTransaction = await oreId.sign(sendTransactionParams)
  console.log('signedUserTransaction', signedUserTransaction)
}

;(async () => {
  try {
    await run()
  } catch (error) {
    console.log('Error:', error)
  }
  process.exit()
})()
