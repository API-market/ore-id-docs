import dotenv from 'dotenv';
import React, { Component } from 'react';
import { OreId } from 'eos-auth';
import scatterProvider from 'eos-transit-scatter-provider';
import ledgerProvider from 'eos-transit-ledger-provider';
import lynxProvider from 'eos-transit-lynx-provider';
import meetoneProvider from 'eos-transit-meetone-provider';
import tokenpocketProvider from 'eos-transit-tokenpocket-provider';
import whalevaultProvider from 'eos-transit-whalevault-provider';
import simpleosProvider from 'eos-transit-simpleos-provider';
import keycatProvider from 'eos-transit-keycat-provider';
// import portisProvider from 'eos-transit-portis-provider'

// import { Scatter } from 'ual-scatter';
// import { Lynx } from 'ual-lynx';
// import { Ledger } from 'ual-ledger';
// import { MeetOne } from 'ual-meetone';
// import { TokenPocket } from 'ual-token-pocket';

import LoginButton from './components/loginButton';

dotenv.config();

let chainNetworkForExample = 'eos_main';

const {
  REACT_APP_OREID_APP_ID: appId, // Provided when you register your app
  REACT_APP_OREID_API_KEY:apiKey, // Provided when you register your app
  REACT_APP_AUTH_CALLBACK:authCallbackUrl, // The url called by the server when login flow is finished - must match one of the callback strings listed in the App Registration
  REACT_APP_SIGN_CALLBACK:signCallbackUrl, // The url called by the server when transaction signing flow is finished - must match one of the callback strings listed in the App Registration
  REACT_APP_OREID_URL:oreIdUrl, // HTTPS Address of OREID server
  REACT_APP_BACKGROUND_COLOR:backgroundColor // Background color shown during login flow
} = process.env;

let eosTransitWalletProviders = [
  scatterProvider(),
  ledgerProvider({ pathIndexList: [ 0, 1, 2, 35 ] }),
  lynxProvider(),
  meetoneProvider(),
  tokenpocketProvider(),
  whalevaultProvider(),
  simpleosProvider(),
  keycatProvider()
  // portisProvider({
  //   DappId: 'ENTER_YOUR_DappId_HERE'
  // }),
];

let ualProviders = [
  // Scatter,
  // Lynx,
  // Ledger,
  // MeetOne,
  // TokenPocket
];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      userInfo: {}
    };
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleSignButton = this.handleSignButton.bind(this);
  }

// called by library to set local busy state
setBusyCallback = (isBusy) => {this.setState({ isBusy });};

// intialize oreId
oreId = new OreId({
  appName: 'ORE ID Sample App',
  appId,
  apiKey,
  oreIdUrl,
  authCallbackUrl,
  signCallbackUrl,
  backgroundColor,
  eosTransitWalletProviders,
  ualProviders,
  setBusyCallback: this.setBusyCallback
});

async componentWillMount() {
  this.loadUserFromLocalState();
  this.handleAuthCallback();
  this.handleSignCallback();
}

async loadUserFromLocalState() {
  const userInfo = await this.oreId.getUser() || {};
  if ((userInfo ||{}).accountName) {
    this.setState({ userInfo, isLoggedIn:true });
  }
}

async loadUserFromApi(account) {
  try {
    const userInfo = await this.oreId.getUserInfoFromApi(account) || {};
    this.setState({ userInfo, isLoggedIn:true });
  } catch (error) {
    this.setState({ errorMessage:error.message });
  }
}

clearErrors() {
  this.setState({
    errorMessage:null,
    signedTransaction:null,
    signState:null
  });
}

handleLogout() {
  this.clearErrors();
  this.setState({ userInfo:{}, isLoggedIn:false });
  this.oreId.logout(); // clears local user state (stored in local storage or cookie)
}

async handleSignButton(permissionIndex) {
  this.clearErrors();
  let { chainAccount, chainNetwork, permission, externalWalletType:provider } = this.permissionsToRender[permissionIndex] || {};
  let { accountName } = this.state.userInfo;
  provider = provider || 'oreid'; // default to ore id
  await this.handleSignSampleTransaction(provider, accountName, chainAccount, chainNetwork, permission);
}

async handleSignStringButton(permissionIndex) {
  this.clearErrors();
  let { chainAccount, chainNetwork, permission, externalWalletType:provider } = this.permissionsToRender[permissionIndex] || {};
  let { accountName } = this.state.userInfo;
  provider = provider || 'oreid'; // default to ore id
  await this.handleSignString(provider, accountName, chainAccount, chainNetwork, permission);
}

async handleWalletDiscoverButton(permissionIndex) {
  let chainNetwork = chainNetworkForExample;
  try {
    this.clearErrors();
    let { provider } = this.walletButtons[permissionIndex] || {};
    if (this.oreId.canDiscover(provider)) {
      await this.oreId.discover({ provider, chainNetwork });
    } else {
      console.log('Provider doesn\'t support discover, so we\'ll call login instead');
      await this.oreId.login({ provider, chainNetwork });
    }
    this.loadUserFromApi(this.state.userInfo.accountName); // reload user from ore id api - to show new keys discovered
  } catch (error) {
    this.setState({ errorMessage:error.message });
  }
}

async handleLogin(provider) {
  let chainNetwork = chainNetworkForExample;
  try {
    this.clearErrors();
    let loginResponse = await this.oreId.login({ provider, chainNetwork });
    // if the login responds with a loginUrl, then redirect the browser to it to start the user's OAuth login flow
    let { isLoggedIn, account, loginUrl } = loginResponse;
    if (loginUrl) {
      // redirect browser to loginURL
      window.location = loginUrl;
    }
    this.setState({ userInfo: { accountName:account }, isLoggedIn });
  } catch (error) {
    this.setState({ errorMessage:error.message });
  }
}

async handleSignString(provider, account, chainAccount, chainNetwork) {
  try {
    const signOptions = {
      provider,
      account,
      chainAccount,
      chainNetwork,
      string: 'testing',
      message: 'test message'
    };
    const response = await this.oreId.signString(signOptions);
    this.setState({ signedString: response });
  } catch (error) {
    this.setState({ errorMessage:error.message });
  }
}

async handleSignSampleTransaction(provider, account, chainAccount, chainNetwork, permission) {
  try {
    // this.clearErrors();
    const transaction = this.createSampleTransaction(chainAccount, permission);
    let signOptions = {
      provider:provider || '', // wallet type (e.g. 'scatter' or 'oreid')
      account:account || '',
      broadcast:true, // if broadcast=true, ore id will broadcast the transaction to the chain network for you
      chainAccount:chainAccount || '',
      chainNetwork:chainNetwork || '',
      state:'abc', // anything you'd like to remember after the callback
      transaction,
      accountIsTransactionPermission:false,
      returnSignedTransaction: true
    };
    let signResponse = await this.oreId.sign(signOptions);
    // if the sign responds with a signUrl, then redirect the browser to it to call the signing flow
    let { signUrl, signedTransaction, state, transactionId } = signResponse || {};
    if (signUrl) {
      // redirect browser to signUrl
      window.location = signUrl;
    }
    if (signedTransaction) {
      this.setState({ signedTransaction:JSON.stringify(signedTransaction), state });
    }
    if (transactionId) this.setState({ transactionId });
  } catch (error) {
    this.setState({ errorMessage:error.message });
  }
}

createSampleTransaction(actor, permission = 'active') {
  const transaction = {
    account: 'demoapphello',
    name: 'hi',
    authorization: [{
      actor,
      permission
    }],
    data: {
      user: actor
    }
  };
  return transaction;
}

/*
   Handle the authCallback coming back from ORE-ID with an "account" parameter indicating that a user has logged in
*/
async handleAuthCallback() {
  const url = window.location.href;
  if (/authcallback/i.test(url)) {
    const { account, errors, state } = await this.oreId.handleAuthResponse(url);
    if (state) console.log(`state returned with request:${state}`);
    if (!errors) {
      this.loadUserFromApi(account);
    }
  }
}

/*
   Handle the signCallback coming back from ORE-ID with a "signedTransaction" parameter providing the transaction object with signatures attached
*/
async handleSignCallback() {
  const url = window.location.href;
  if (/signcallback/i.test(url)) {
    const { signedTransaction, state, transactionId, errors } = await this.oreId.handleSignResponse(url);
    if (!errors) {
      if (state) this.setState({ signState:state });
      if (signedTransaction) this.setState({ signedTransaction:JSON.stringify(signedTransaction) });
      if (transactionId) this.setState({ transactionId:JSON.stringify(transactionId) });
    } else {
      this.setState({ errorMessage:errors.join(', ') });
    }
  }
}

render() {
  let { errorMessage, isBusy, isLoggedIn, signedTransaction, signState, transactionId, signedString } = this.state;
  return (
    <div>
      <div>
        {!isLoggedIn &&
          this.renderLoginButtons()
        }
        {isLoggedIn &&
          this.renderUserInfo()
        }
        {isLoggedIn &&
          this.renderSigningOptions()
        }
        {isLoggedIn &&
          this.renderSignStringOptions()
        }
      </div>
      <h3 style={{ color:'green', margin:'50px' }}>
        {(isBusy) && 'working...'}
      </h3>
      <div style={{ color:'red', margin:'50px' }}>
        {(errorMessage) && errorMessage}
      </div>
      <div style={{ color:'blue', marginLeft:'50px', marginTop:'50px' }}>
        {(transactionId) && `Returned transactionId: ${transactionId}`}
      </div>
      <div style={{ color:'blue', marginLeft:'50px', marginTop:'10px' }}>
        {(signedTransaction) && `Returned signed transaction: ${signedTransaction}`}
      </div>
      <div style={{ color:'blue', marginLeft:'50px',marginTop:'10px' }}>
        {(signState) && `Returned state param: ${signState}`}
      </div>
      <div style={{ color:'blue', marginLeft:'50px', marginTop:'10px' }}>
        {(signedString) && `Returned signed string: ${JSON.stringify(signedString)}`}
      </div>
      {isLoggedIn &&
          this.renderDiscoverOptions()
      }
    </div>
  );
}

renderUserInfo() {
  const { accountName, email, name, picture, username } = this.state.userInfo;
  return (
    <div style={{ marginTop:50, marginLeft:40 }}>
      <h3>User Info</h3>
      <img src={picture} style={{ width:50,height:50 }} alt={'user'}/><br/>
      accountName: {accountName}<br/>
      name: {name}<br/>
      username: {username}<br/>
      email: {email}<br/>
      <button onClick={this.handleLogout} style={{ marginTop:20, padding: '10px', backgroundColor: '#FFFBE6', borderRadius: '5px' }}>
        Logout
      </button>
    </div>
  );
}

renderSigningOptions() {
  let { permissions } = this.state.userInfo;
  this.permissionsToRender = (permissions ||[]).slice(0);

  return (
    <div>
      <div style={{ marginTop:50, marginLeft:20 }}>
        <h3>Sign transaction with one of your keys</h3>
        <ul>
          {this.renderSignButtons(this.permissionsToRender)}
        </ul>
      </div>
    </div>
  );
}

renderSignStringOptions() {
  let { permissions } = this.state.userInfo;
  this.permissionsToRender = (permissions ||[]).slice(0);

  return (
    <div>
      <div style={{ marginTop:50, marginLeft:20 }}>
        <h3>Sign string `testing` with one of your keys</h3>
        <ul>
          {this.renderSignStringButtons(this.permissionsToRender)}
        </ul>
      </div>
    </div>
  );
}

renderDiscoverOptions() {
  let chainNetwork = chainNetworkForExample;
  this.walletButtons = [
    { provider: 'scatter', chainNetwork },
    { provider: 'ledger', chainNetwork },
    { provider: 'lynx', chainNetwork },
    { provider: 'meetone', chainNetwork },
    { provider: 'tokenpocket', chainNetwork },
    { provider: 'portis', chainNetwork },
    { provider: 'whalevault', chainNetwork },
    { provider: 'simpleos', chainNetwork },
    { provider: 'keycat', chainNetwork }
  ];
  return (
    <div>
      <div style={{ marginTop:50, marginLeft:20 }}>
        <h3 style={{ marginTop:50 }}>Or discover a key in your wallet</h3>
        <ul>
          {this.renderWalletDiscoverButtons(this.walletButtons)}
        </ul>
      </div>
    </div>
  );
}

// render one sign transaction button for each chain
renderSignButtons = (permissions) => permissions.map((permission, index) => {
  let provider = permission.externalWalletType || 'oreid';
  return (
    <div style={{ alignContent:'center' }} key={index}>
      <LoginButton provider={provider} data-tag={index} buttonStyle={{ width:225, marginLeft:-20, marginTop:20, marginBottom:10 }} text={`Sign with ${provider}`} onClick={() => {this.handleSignButton(index);}}>{`Sign Transaction with ${provider}`}</LoginButton>
      {`Chain:${permission.chainNetwork} ---- Account:${permission.chainAccount} ---- Permission:${permission.permission}`}
    </div>
  );
});

renderSignStringButtons = (permissions) => permissions.map((permission, index) => {
  let provider = permission.externalWalletType || 'oreid';
  return (
    <div style={{ alignContent:'center' }} key={index}>
      <LoginButton provider={provider} data-tag={index} buttonStyle={{ width:225, marginLeft:-20, marginTop:20, marginBottom:10 }} text={`Sign String with ${provider}`} onClick={() => {this.handleSignStringButton(index);}}>{`Sign Transaction with ${provider}`}</LoginButton>
      {`Chain:${permission.chainNetwork} ---- Account:${permission.chainAccount} ---- Permission:${permission.permission}`}
    </div>
  );
});

  // render one sign transaction button for each chain
  renderWalletDiscoverButtons = (walletButtons) => walletButtons.map((wallet, index) => {
    let { provider } = wallet;
    return (
      <div style={{ alignContent:'center' }} key={index} >
        <LoginButton provider={provider} data-tag={index} buttonStyle={{ width:80, marginLeft:-20, marginTop:20, marginBottom:10 }} text={`${provider}`} onClick={() => {this.handleWalletDiscoverButton(index);}}>{`${provider}`}</LoginButton>
      </div>
    );
  });

  renderLoginButtons() {
    return (
      <div>
        <LoginButton provider='facebook'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('facebook')}
          //  text='Log in with Facebook'
        />
        <LoginButton provider='twitter'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('twitter')}
          //  text='Log in with Twitter'
        />
        <LoginButton provider='github'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('github')}
          //  text='Log in with Github'
        />
        <LoginButton provider='twitch'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('twitch')}
          //  text='Log in with Twitch'
        />
        <LoginButton provider='line'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('line')}
          //  text='Log in with Line'
        />
        <LoginButton provider='kakao'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('kakao')}
          //  text='Log in with Kakao'
        />
        <LoginButton provider='linkedin'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('linkedin')}
          //  text='Log in with LinkedIn'
        />
        <LoginButton provider='google'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('google')}
          //  text='Log in with Google'
        />
        <LoginButton provider='scatter'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('scatter')}
          //  text='Log in with Scatter'
        />
        <LoginButton provider='ledger'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('ledger')}
        />
        <LoginButton provider='meetone'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('meetone')}
        />
        <LoginButton provider='lynx'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('lynx')}
        />
        <LoginButton provider='tokenpocket'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('tockenpocket')}
        />
        <LoginButton provider='portis'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('portis')}
        />
        <LoginButton provider='whalevault'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('whalevault')}
        />
        <LoginButton provider='simpleos'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('simpleos')}
        />
        <LoginButton provider='keycat'
          buttonStyle={{ width:250, marginTop:'24px' }}
          logoStyle={{ marginLeft:0 }}
          onClick={() => this.handleLogin('keycat')}
        />
      </div>
    );
  }
}

export default App;
