import fetch from 'cross-fetch';
import {
  arrayUtils,
  wrexDi,
  IHttpClient as _IHttpClient,
  IKeyValueDb as _IKeyValueDb,
  RestApi as _RestApi,
  RestApiOptionsRequest as _RestApiOptionsRequest
} from '@wrex/wrex-core';
import {globalWrexNetwork, Snapshot as _Snapshot, Transaction as _Transaction, PendingTx as _PendingTx, NetworkInfo as _NetworkInfo} from '@wrex/wrex-network';
import {keyStore, HDKey as _HDKey, DERIVATION_PATH as _DERIVATION_PATH} from '@wrex/wrex-keystore';
import {WrexAccount, WrexMonitor} from '@wrex/wrex-wallet';


export namespace WrexTypes {
  export type HDKey = _HDKey;
  export type DERIVATION_PATH = _DERIVATION_PATH;
  export type RestApi = _RestApi;
  export type IKeyValueDb = _IKeyValueDb;
  export type IHttpClient = _IHttpClient;
  export type Transaction = _Transaction;
  export type PendingTx = _PendingTx;
  export type NetworkInfo = _NetworkInfo;
  export type Snapshot = _Snapshot;
  export type RestApiOptionsRequest = _RestApiOptionsRequest;
}

class WrexPackages {
  private account: WrexAccount;
  private monitor: WrexMonitor;

  createAccount (privateKey?: string) {

    const account =  new WrexAccount(globalWrexNetwork);

    if (privateKey) {
      account.loginPrivateKey(privateKey);
    }

    return account;
  }

  createOrGetGlobalAccount () {
    if (!this.account) {
      this.account = new WrexAccount(globalWrexNetwork);
    }
    return this.account;
  }

  createOrGetGlobalMonitor () {
    if (!this.monitor) {
      this.monitor = new WrexMonitor(this.createOrGetGlobalAccount());
    }
    return this.monitor;
  }
}

const wrexPackages = new WrexPackages();

export const wrex = {
  keyStore,
  di: wrexDi,
  createAccount (privateKey?: string) {
    return wrexPackages.createAccount(privateKey);
  },
  get account () {
    return wrexPackages.createOrGetGlobalAccount();
  },
  get monitor () {
    return wrexPackages.createOrGetGlobalMonitor();
  },
  config: (config: WrexConfig) => {
    wrexDi.getStateStorageDb().setPrefix(config.appId);
    globalWrexNetwork.config(config.network);
  },
  network: globalWrexNetwork,
  arrayUtils
}

type WrexConfig = {
  appId: string;
  network: WrexTypes.NetworkInfo
}

// default config
wrex.di.useFetchHttpClient(fetch);
