/* eslint-disable max-len */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */

import dotenv from "dotenv";
import {
  ChainFactory,
  ChainType,
  HelpersAlgorand,
  Models,
  ModelsAlgorand,
} from "@open-rights-exchange/chainjs";
import { isNullOrUndefined } from "util";

dotenv.config();

const algoApiKey = process.env.REACT_APP_AGLORAND_API_KEY;
const algoFundingPrivateKey = process.env.REACT_APP_ALGORAND_ALGO_FUNDING_PRIVATE_KEY as string;
const multisigAccountSigningKey = process.env.REACT_APP_ALGORAND_MULTISIG_ACCOUNT;

const algoMainnetEndpoints = [
  {
    url: new URL("http://mainnet-algorand.api.purestake.io/ps1"),
    options: { headers: [{ "X-API-Key": algoApiKey }] },
  },
];
const algoTestnetEndpoints = [
  {
    url: new URL("http://testnet-algorand.api.purestake.io/ps1"),
    options: { headers: [{ "X-API-Key": algoApiKey }] },
  },
];
const algoBetanetEndpoints = [
  {
    url: new URL("http://betanet-algorand.api.purestake.io/ps1"),
    options: { headers: [{ "X-API-Key": algoApiKey }] },
  },
];

/** Transfer Algos to account - on TestNet */
export async function transferAlgosToAccount(
  algoPaymentParams: ModelsAlgorand.AlgorandActionPaymentParams
) {
  /** Create Algorand chain instance */
  const algoTest = new ChainFactory().create(
    ChainType.AlgorandV1,
    algoTestnetEndpoints
  );
  await algoTest.connect();

  /** Compose and send transaction */
  const transaction = algoTest.new.Transaction();

  // Compose an action from basic parameters using composeAction function
  const action = await algoTest.composeAction(
    ModelsAlgorand.AlgorandChainActionType.Payment,
    algoPaymentParams
  );
  transaction.actions = [action];
  await transaction.prepareToBeSigned();
  await transaction.validate();
  await transaction.sign([
    HelpersAlgorand.toAlgorandPrivateKey(algoFundingPrivateKey),
  ]);
  return await transaction.send();
}

interface Permission {
  accountType: string
  chainAccount: string
  chainNetwork: string
  externalWalletType: string
  permission: string
  permissionName: string
  privateKeyStoredExterally: boolean
  publicKey: string
}

/**
 * Returns the multisig metadata for a specific account if it exists
 */
export const getMultisigMetadata = (userInfo: any, chainAccount: string) => {
  const chainAccountInfo = userInfo?.permissions?.find((permission: Permission) => {
    return permission.chainAccount === chainAccount
  })

  return chainAccountInfo?.metadata?.algorandMultisig
}

/**
 * Returns the required chainAccounts for the multsig transaction.
 * The `keyAccount` is in the users permissions and used to create the multisig (asset) account
 * We find the keyAccount in user.permissions and add `multisigAccountSigningKey` which is the second
 * account that will sign. 
 * 
 * Which account to use for multisigAccountSigningKey MUST be decided by the developer and be one of the
 * keys in the `addrs` field on chain. 
 */
export const getMultisigChainAccountsForTransaction = (userInfo: any, chainAccount: string) => {
  const algorandMultisig = getMultisigMetadata(userInfo, chainAccount)

  if (isNullOrUndefined(algorandMultisig)) {
    return null
  }

  const keyAccount = userInfo.permissions.find((permission: Permission) => {
    return algorandMultisig.addrs?.includes(permission?.chainAccount)
  })

  return `${keyAccount?.chainAccount},${multisigAccountSigningKey}`
}
