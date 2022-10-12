import fetch from 'cross-fetch';
import {
  arrayUtils,
  werxDi,
  IHttpClient as _IHttpClient,
  IKeyValueDb as _IKeyValueDb,
  RestApi as _RestApi,
  RestApiOptionsRequest as _RestApiOptionsRequest
} from '@estar-solutions/werx-core';
import {globalWerxNetwork, SnapshotV2 as _Snapshot, TransactionV2 as _Transaction, PendingTx as _PendingTx, NetworkInfo as _NetworkInfo} from '@estar-solutions/werx-network';
import {keyStore, HDKey as _HDKey, DERIVATION_PATH as _DERIVATION_PATH} from '@estar-solutions/werx-keystore';
import {WerxAccount, werxMonitor} from '@estar-solutions/werx-wallet';


export namespace WerxTypes {
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

class WerxPackages {
  private account: WerxAccount;
  private monitor: werxMonitor;

  createAccount (privateKey?: string) {

    const account =  new WerxAccount(globalWerxNetwork);

    if (privateKey) {
      account.loginPrivateKey(privateKey);
    }

    return account;
  }

  createOrGetGlobalAccount () {
    if (!this.account) {
      this.account = new WerxAccount(globalWerxNetwork);
    }
    return this.account;
  }

  createOrGetGlobalMonitor () {
    if (!this.monitor) {
      this.monitor = new werxMonitor(this.createOrGetGlobalAccount());
    }
    return this.monitor;
  }
}

const werxPackages = new WerxPackages();

export const werx = {
  keyStore,
  di: werxDi,
  createAccount (privateKey?: string) {
    return werxPackages.createAccount(privateKey);
  },
  get account () {
    return werxPackages.createOrGetGlobalAccount();
  },
  get monitor () {
    return werxPackages.createOrGetGlobalMonitor();
  },
  config: (config: werxConfig) => {
    werxDi.getStateStorageDb().setPrefix(config.appId);
    globalWerxNetwork.config(config.network);
  },
  network: globalWerxNetwork,
  arrayUtils
}

type werxConfig = {
  appId: string;
  network: WerxTypes.NetworkInfo
}

// default config
werx.di.useFetchHttpClient(fetch);
