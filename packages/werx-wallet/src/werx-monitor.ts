import {crossPlatformDi} from '@estar-solutions/werx-core';
import {PendingTx, TransactionV2} from '@estar-solutions/werx-network';
import {WerxAccount} from './werx-account';
import {Subject} from 'rxjs';

const TWELVE_MINUTES = 12 * 60 * 1000;

type WaitFor = {
  promise: Promise<boolean>,
  resolve: (val: boolean) => void
}

export class werxMonitor {

  private memPoolChange$ = new Subject<werxWalletMonitorUpdate>();
  private lastTimer: number;
  private pendingTimer = 0;
  private waitForMap: { [hash:string]: WaitFor } = {};

  constructor (private werxAccount: WerxAccount) {
    this.cacheUtils.setPrefix('stargazer-');
  }

  observeMemPoolChange() {
    return this.memPoolChange$;
  }

  async addToMemPoolMonitor (value: PendingTx | string): Promise<TransactionV2> {
    const networkInfo = this.werxAccount.networkInstance.getNetwork();
    const key =  `network-${networkInfo.id}-mempool`;

    let payload: PendingTx[] = (await this.cacheUtils.get(key)) || [];

    let tx = value as PendingTx;

    if (typeof value === 'string') {
      tx = { hash: value, timestamp: Date.now() } as PendingTx;
    }

    if (!payload || !payload.some) {
      payload = [];
    }

    if (!payload.some(p => p.hash === tx.hash)) {

      payload.push(tx);

      await this.cacheUtils.set(key, payload);

      this.lastTimer = Date.now();
      this.pendingTimer = 1000;
    }

    setTimeout(() => this.pollPendingTxs(), 1000);

    return this.transformPendingToTransaction(tx);
  }

  async getLatestTransactions (address: string, limit?: number, searchAfter?: string): Promise<(TransactionV2)[]> {
    const cTxs = await this.werxAccount.networkInstance.getTransactionsByAddress(address, limit, searchAfter);    

    const { pendingTxs } = await this.processPendingTxs();
    const pendingTransactions = pendingTxs.map(pending => this.transformPendingToTransaction(pending));

    if (cTxs && cTxs.length) {
    return pendingTransactions.concat(cTxs);
    }

    return pendingTransactions;
  }

  async getMemPoolFromMonitor(address?: string): Promise<PendingTx[]> {
    address = address || this.werxAccount.address;
    const networkInfo = this.werxAccount.networkInstance.getNetwork();

    let txs: PendingTx[] = [];

    try {
        txs = await this.cacheUtils.get(`network-${networkInfo.id}-mempool`)
    } catch (err) {
        console.log('getMemPoolFromMonitor err: ', err);
        console.log(err.stack);
        return [];
    }

    if (!txs) {
        txs = [];
    }

    return txs.filter(tx => !address || !tx.receiver || tx.receiver === address || tx.sender === address);
  }

  async setToMemPoolMonitor(pool: PendingTx[]) {
    const networkInfo = this.werxAccount.networkInstance.getNetwork();
    const key =  `network-${networkInfo.id}-mempool`;

    await this.cacheUtils.set(key, pool);
  }

  async waitForTransaction (hash: string) {
    if (!this.waitForMap[hash]) {
      const waitFor = {} as WaitFor;
      waitFor.promise = new Promise<boolean>(resolve => waitFor.resolve = resolve);
      this.waitForMap[hash] = waitFor;
    }

    return this.waitForMap[hash].promise;
  }

  startMonitor () {
    this.pollPendingTxs();
  }

  private transformPendingToTransaction (pending: PendingTx): TransactionV2 {
    const { hash, amount, receiver, sender, timestamp, ordinal, fee, status } =  pending;
    return { 
      hash, 
      source: sender, 
      destination: receiver, 
      amount, 
      fee, 
      parent: { ordinal, hash: '' },
      snapshot: '',
      block: '',
      timestamp: new Date(timestamp).toISOString(),
      transactionOriginal: { ordinal, hash },
    } as TransactionV2;
  }

  private async pollPendingTxs () {

    if (Date.now() - this.lastTimer + 1000 < this.pendingTimer) {
      console.log('canceling extra timer');
      return; //ignore any repeat timers that happen before the min timer
    }

    const { pendingTxs, txChanged, transTxs, pendingHasConfirmed, poolCount } = await this.processPendingTxs();

    //Has any memPollTxs pending
    if (pendingTxs.length) {
      await this.setToMemPoolMonitor(pendingTxs);
      this.pendingTimer = 10000;
      this.lastTimer = Date.now();
      setTimeout(() => this.pollPendingTxs(), 10000);
    } else if (poolCount > 0) {
      //NOTE: All tx in persisted pool have completed
      await this.setToMemPoolMonitor([]);
    }

    this.memPoolChange$.next({
      txChanged, transTxs, pendingHasConfirmed
    });

  }

  private async processPendingTxs () {
    const pool = await this.getMemPoolFromMonitor();
    const transTxs: PendingTx[] = [];
    const nextPool: PendingTx[] = [];

    let pendingHasConfirmed = false;
    let txChanged = false;

    for (let index = 0; index < pool.length; index++) {
      const pendingTx = pool[index];
      const txHash = pendingTx.hash;

      let beTx: TransactionV2;

        try {
          beTx = await this.werxAccount.networkInstance.getTransaction(txHash);
        } catch(e) {}

        if (beTx) {

          //NOTE: not needed as it is already confirmed
          // if (!pendingTx.sender) {
          //   pendingTx.sender = beTx.sender;
          //   pendingTx.receiver = beTx.receiver;
          //   pendingTx.amount = beTx.amount;
          //   pendingTx.fee = beTx.fee;
          //   pendingTx.ordinal = beTx.lastTransactionRef.ordinal;
          // }

          pendingTx.timestamp = new Date(beTx.timestamp).valueOf();
          pendingHasConfirmed = true;
          txChanged = true;

          pendingTx.pending = false;
          pendingTx.status = 'CONFIRMED'
          pendingTx.pendingMsg = 'Confirmed';

          if (this.waitForMap[txHash]) {
            this.waitForMap[txHash].resolve(true);
            this.waitForMap[txHash] = null;
          }

        } else {

          if (pendingTx.status !== 'CHECKPOINT_ACCEPTED' && pendingTx.status !== 'GLOBAL_STATE_PENDING' && pendingTx.timestamp + TWELVE_MINUTES > Date.now()) {
            //TX has been dropped
            pendingTx.status = 'DROPPED';
            pendingTx.pending = false;
            txChanged = true;
          }
          else {

            if (pendingTx.status !== 'GLOBAL_STATE_PENDING') {
              pendingTx.status = 'GLOBAL_STATE_PENDING'
              pendingTx.pendingMsg = 'Will confirm shortly...';
              txChanged = true;
            }
            else if (!pendingTx.status) {
              pendingTx.status = 'UNKNOWN'
              pendingTx.pendingMsg = 'Transaction not found...';
              txChanged = true;
            }

            //pending-tx transitioning from Node to BlockExplorer
            nextPool.push(pendingTx);
          }
        }

      transTxs.push(pendingTx);
    }

    return { pendingTxs: nextPool, txChanged, transTxs, pendingHasConfirmed, poolCount: pool.length }
  }

  private get cacheUtils() {
    return crossPlatformDi.getStateStorageDb();
  }
}

type NetworkInfo = {
  id: string;
}

export type werxWalletMonitorUpdate = {
  pendingHasConfirmed: boolean;
  transTxs: PendingTx[];
  txChanged: boolean;
}

// class MonitorPendingTx {
//   hash: string;
//   sender: string;
//   receiver: string;
//   amount: number;
//   ordinal: number;
//   pending = true;
//   pendingMsg: string;
// }
