import React, { Component } from "react";
// import ReactDOM from 'react-dom';
import { OreId } from "oreid-js";
import LoginButton from "oreid-login-button";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import OreIdComponent from "oreid-react-web-widget";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: {},
      errors: "",
      isLoggedIn: false,
      authInfo: {},
      oreIdResult: '',
      showModal: false,
    };
    this.handleSubmit = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.openInModal = this.openInModal.bind(this);
    this.onCloseModal = this.onCloseModal.bind(this);
  }
  authCallbackUrl = `http://localhost:3000/authcallback`;

  // Intialize oreId
  // IMPORTANT - For a production app, you must protect your api key. A create-react-app app will leak the key since it all runs in the browser.
  // To protect the key, you need to set-up a proxy server. See https://github.com/TeamAikon/ore-id-docs/tree/master/examples/react/advanced/react-server
  oreId = new OreId({
    appName: "Viktor's app",
    appId: process.env.REACT_APP_OREID_APP_ID,
    apiKey: process.env.REACT_APP_OREID_API_KEY,
    oreIdUrl: "http://localhost:8080",
    authCallbackUrl: this.authCallbackUrl,
  });

  async componentWillMount() {
    await this.loadUserFromLocalStorage();
    await this.handleAuthCallback(); // handles the auth callback url
  }

  /* Call oreId.login() - this returns a redirect url which will launch the login flow (for the specified provider)
     When complete, the browser will be redirected to the authCallbackUrl (specified in oredId options) */
  async handleLogin(event, provider) {
    event.preventDefault();
    let { loginUrl } = await this.oreId.login({ provider });
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
    if (userInfo.accountName) this.setState({ userInfo, isLoggedIn: true });
  }

  /** Retrieve user info from ORE ID service - user info is automatically saved to local storage */
  async loadUserFromApi(account) {
    const userInfo = (await this.oreId.getUserInfoFromApi(account)) || {};
    if (userInfo.accountName) this.setState({ userInfo, isLoggedIn: true });
  }

  /* Handle the authCallback coming back from ORE ID with an "account" parameter indicating that a user has logged in */
  async handleAuthCallback() {
    const urlPath = `${window.location.origin}${window.location.pathname}`;
    if (urlPath === this.authCallbackUrl) {
      const { account, errors } = this.oreId.handleAuthResponse(
        window.location.href
      );
      if (!errors) {
        await this.loadUserFromApi(account);
        this.setState({ isLoggedIn: true });
      } else {
        this.setState({ errors });
      }
    }
  }

  getFirstChainAccountForUserByChainType(chainNetwork) {
    const matchingPermission = this.state?.userInfo?.permissions?.find(
      (p) => p.chainNetwork === chainNetwork
    );
    const { chainAccount, permissionName } = matchingPermission || {};
    return { chainAccount, permissionName };
  }

  createSampleTransactionEos(actor, permission = 'active') {
    const transaction = {
      account: 'demoapphello',
      name: 'hi',
      authorization: [
        {
          actor,
          permission
        }
      ],
      data: {
        user: actor
      }
    };
    return transaction;
  }

  renderLoggedIn() {
    const signWithChainNetwork = "eos_kylin";
    const { accountName, email, name, picture, username } = this.state.userInfo;
    const { chainAccount, permissionName } =
      this.getFirstChainAccountForUserByChainType(signWithChainNetwork);
    return (
      <div style={{ marginTop: 50, marginLeft: 40 }}>
        <h4>User Info</h4>
        <img
          src={picture}
          style={{ width: 100, height: 100, paddingBottom: 30 }}
          alt={"user"}
        />
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
        <br />
        <Button color="primary" variant="contained" onClick={this.openInModal}>
          Sign with modal
        </Button>
        <br />
        <div className="App-success">
          {this?.state?.oreIdResult}
        </div>
        <Dialog open={this.state.showModal} onClose={this.onCloseModal}>
          <DialogTitle>Sign Transaction</DialogTitle>
          <DialogContent>
            <OreIdComponent
              oreIdOptions={{
                appName: "Viktor's app",
                appId: process.env.REACT_APP_OREID_APP_ID,
                apiKey: process.env.REACT_APP_OREID_API_KEY,
                oreIdUrl: "http://localhost:8080",
                signCallbackUrl: this.authCallbackUrl,
              }}
              action="sign"
              options={{
                accessToken: this.oreId.accessToken,
                provider: "oreid", // wallet type (e.g. 'algosigner' or 'oreid')
                account: accountName,
                broadcast: true, // if broadcast=true, ore id will broadcast the transaction to the chain network for you
                chainAccount: chainAccount,
                chainNetwork: signWithChainNetwork,
                state: "test", // anything you'd like to remember after the callback
                transaction: this.createSampleTransactionEos(chainAccount, permissionName),
                returnSignedTransaction: false,
                preventAutoSign: false, // prevent auto sign even if transaction is auto signable
              }}
              onSuccess={(result) => {
                this.setState({ oreIdResult: JSON.stringify(result, null, '\t') });
                this.onCloseModal();
              }}
              onError={(result) => {
                this.setState({ errors: result?.errors });
                this.onCloseModal();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  openInModal() {
    this.setState({ showModal: true });
  }

  onCloseModal() {
    this.setState({ showModal: false });
  }

  renderLoggedOut() {
    return (
      <div>
        <LoginButton
          provider="facebook"
          onClick={(e) => this.handleLogin(e, "facebook")}
        />
        <LoginButton
          provider="google"
          onClick={(e) => this.handleLogin(e, "google")}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          {this.state.isLoggedIn ? (
            <div>{this.renderLoggedIn()} </div>
          ) : (
            <div>{this.renderLoggedOut()} </div>
          )}
          {this.state.errors && (
            <div className="App-error">Error: {this.state.errors}</div>
          )}
        </header>
      </div>
    );
  }
}

export default App;
