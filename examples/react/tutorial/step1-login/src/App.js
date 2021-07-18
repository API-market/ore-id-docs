import React, { Component } from 'react';
import './App.css';
import { OreId } from 'oreid-js';
import LoginButton from 'oreid-login-button';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: {},
      errors: "",
      isLoggedIn: false
    };
    this.handleSubmit = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this)
  }

  authCallbackUrl = `${window.location.origin}/authcallback`

  // Intialize oreId
  // IMPORTANT - For a production app, you must protect your api key. A create-react-app app will leak the key since it all runs in the browser. 
  // To protect the key, you need to set-up a proxy server. See https://github.com/TeamAikon/ore-id-docs/tree/master/examples/react/advanced/react-server
  oreId = new OreId({
    appName: 'ORE ID Sample App',
    appId: process.env.REACT_APP_OREID_APP_ID,
    // apiKey: process.env.REACT_APP_OREID_API_KEY,
    oreIdUrl: 'http://localhost:8080',
    authCallbackUrl: this.authCallbackUrl
  });

  async componentWillMount() {
    await this.loadUserFromLocalStorage();
    await this.handleAuthCallback(); // handles the auth callback url 
  }

  /* Call oreId.login() - this returns a redirect url which will launch the login flow (for the specified provider) 
     When complete, the browser will be redirected to the authCallbackUrl (specified in oredId options) */
  async handleLogin(event, provider) {
    event.preventDefault();
    let { loginUrl } = await this.oreId.login({provider})
    window.location = loginUrl; // redirect browser to loginURL to start the login flow
  }

  /** Remove user info from local storage */
  async handleLogout() {
    this.setState({ userInfo: {}, isLoggedIn: false });
    this.oreId.logout();
    window.location = window.location.origin; // clear callback url in browser
  }

  /** Load the user from local storage - user info is automatically saved to local storage by oreId.getUserInfoFromApi() */
  async loadUserFromLocalStorage() {
    let userInfo = (await this.oreId.getUser()) || {};
    if(userInfo?.accountName) this.setState({ userInfo, isLoggedIn: true });
  }

  /** Retrieve user info from ORE ID service - user info is automatically saved to local storage */
  async loadUserFromApi(account) {
    const userInfo = (await this.oreId.getUserInfoFromApi(account)) || {};
    if(userInfo.accountName) this.setState({ userInfo, isLoggedIn: true });
  }

  /* Handle the authCallback coming back from ORE ID with an "account" parameter indicating that a user has logged in */
  async handleAuthCallback() {
    const urlPath = `${window.location.origin}${window.location.pathname}`;
    if (urlPath === this.authCallbackUrl) {
      const { accessToken, account, errors } = this.oreId.handleAuthResponse(window.location.href);
      if (!errors) {
        await this.loadUserFromApi(account);
        this.setState({ isLoggedIn: true });
      } else {
        this.setState({ errors });
      }
    }
  }

  renderLoggedIn() {
    const { accountName, email, name, picture, username } = this.state.userInfo;
    return (
      <div style={{ marginTop: 50, marginLeft: 40 }}>
        <h4>User Info</h4>
        <img src={picture} style={{ width: 100, height: 100, paddingBottom: 30 }} alt={'user'} />
        <br />
        OreId account: {accountName}
        <br />
        name: {name}
        <br />
        username: {username}
        <br />
        email: {email}
        <br />
        <button onClick={this.handleLogout}> Logout </button>
      </div>
    );
  }

  renderLoggedOut() {
    return (
      <div>
        <LoginButton provider='facebook' onClick={(e) => this.handleLogin(e, 'facebook')}/>
        <LoginButton provider='google' onClick={(e) => this.handleLogin(e, 'google')}/>
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
        {
        this.state.isLoggedIn ? 
        <div>{this.renderLoggedIn()} </div> : 
        <div>{this.renderLoggedOut()} </div>
        }
        {this.state.errors && (
            <div className="App-error">Error: {this.state.errors}</div>
        )}
        </header>
      </div>
    );
  }
}

export default App;
