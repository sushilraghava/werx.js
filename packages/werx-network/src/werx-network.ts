import { Subject } from 'rxjs';
import { NetworkInfo } from './types/network-info';
import { L0Api } from './api/v2/l0-api';
import { L1Api } from './api/v2/l1-api';
import { BlockExplorerV2Api } from './api/v2/block-explorer-api';
import { PostTransactionV2, PendingTransaction, TransactionV2, SnapshotV2 } from './dto/v2';

export class WerxNetwork {
  private connectedNetwork: NetworkInfo = { id: 'main', beUrl: '', l0Url: '', l1Url: '' };

  private networkChange$ = new Subject<NetworkInfo>();

  blockExplorerV2Api = new BlockExplorerV2Api();
  l0Api = new L0Api();
  l1Api = new L1Api();

  constructor(netInfo?: NetworkInfo) {
    if (netInfo) {
      this.setNetwork(netInfo);
    }
  }

  config(netInfo?: NetworkInfo) {
    if (netInfo) {
      this.setNetwork(netInfo);
    }
    else {
      return this.getNetwork();
    }
  }

  observeNetworkChange() {
    return this.networkChange$;
  }

  //Configure the network of the global instances: blockExplorerApi and loadBalancerApi
  setNetwork(netInfo: NetworkInfo) {
    if (this.connectedNetwork !== netInfo) {
      this.connectedNetwork = netInfo;

      this.blockExplorerV2Api.config().baseUrl(netInfo.beUrl);
      this.l0Api.config().baseUrl(netInfo.l0Url);
      this.l1Api.config().baseUrl(netInfo.l1Url);

      this.networkChange$.next(netInfo);
    }
  }

  getNetwork() {
    return this.connectedNetwork;
  }

  async getAddressBalance(address: string) {
    return this.l0Api.getAddressBalance(address);
  }

  async getAddressLastAcceptedTransactionRef(address: string) {
    return this.l1Api.getAddressLastAcceptedTransactionRef(address);
  }

  async getPendingTransaction(hash: string | null): Promise<null | PendingTransaction> {
    let pendingTransaction = null;
    try {
      pendingTransaction = await this.l1Api.getPendingTransaction(hash);
    } catch (e: any) {
      // NOOP 404
    }
    return pendingTransaction;
  }

  async getTransactionsByAddress(address: string, limit?: number, searchAfter?: string): Promise<TransactionV2[]> {
    let response = null;
    try {
      response = await this.blockExplorerV2Api.getTransactionsByAddress(address, limit, searchAfter);
    } catch (e: any) {
      // NOOP 404
    }
    return response ? response.data : null;
  }

  async getTransaction(hash: string | null): Promise<null | TransactionV2> {
    let response = null;
    try {
      response = await this.blockExplorerV2Api.getTransaction(hash);
    } catch (e: any) {
      // NOOP 404
    }
    return response ? response.data : null;
  }

  async postTransaction(tx: PostTransactionV2): Promise<string> {
    const response = await this.l1Api.postTransaction(tx as PostTransactionV2) as any;

    // Support data/meta format and object return format
    return response.data ? response.data.hash : response.hash;
  }

  async getLatestSnapshot(): Promise<SnapshotV2> {
    const response = await this.blockExplorerV2Api.getLatestSnapshot() as any;

    return response.data;
  }
}

