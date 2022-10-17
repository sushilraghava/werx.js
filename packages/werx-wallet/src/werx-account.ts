import {keyStore, KeyTrio, PostTransactionV2} from '@estar-solutions/werx-keystore';
import {WERX_DECIMALS} from '@estar-solutions/werx-core';
import {globalWerxNetwork, GlobalWerxNetwork, WerxNetwork, NetworkInfo, PendingTx, TransactionReference} from '@estar-solutions/werx-network';
import {BigNumber} from 'bignumber.js';
import {Subject} from 'rxjs';
import {networkConfig} from './network-config';

export class WerxAccount {

  private m_keyTrio: KeyTrio;
  private sessionChange$ = new Subject<boolean>();
  private network: WerxNetwork | GlobalWerxNetwork;

  constructor(network: WerxNetwork | GlobalWerxNetwork) {
    this.network = network || globalWerxNetwork;
  }

  connect(networkInfo: Omit<NetworkInfo, 'id'> & { id?: string }, useDefaultConfig = true) {
    let baseConfig = {};

    if (useDefaultConfig) {
      const networkType = networkInfo.testnet ? 'testnet' : 'mainnet';

      baseConfig = networkConfig[networkType];
    }

    const networkId = networkInfo.id || 'global';

    this.network.config({
      ...baseConfig,
      ...networkInfo,
      id: networkId
    });

    return this;
  }

  get address () {
    const address = this.m_keyTrio && this.m_keyTrio.address;

    if (!address) {
      throw new Error('Need to login before calling methods on werx.account');
    }

    return address;
  }

  get keyTrio () {
    return this.m_keyTrio;
  }

  get publicKey () {
    return this.m_keyTrio.publicKey;
  }

  get networkInstance () {
    return this.network;
  }
  
  loginSeedPhrase (words: string) {
    const privateKey = keyStore.getPrivateKeyFromMnemonic(words);

    this.loginPrivateKey(privateKey);
  }

  loginPrivateKey (privateKey: string) {
    const publicKey = keyStore.getPublicKeyFromPrivate(privateKey);
    const address = keyStore.getWerxAddressFromPublicKey(publicKey);

    this.setKeysAndAddress(privateKey, publicKey, address);
  }

  loginPublicKey (publicKey: string) {
    const address = keyStore.getWerxAddressFromPublicKey(publicKey);

    this.setKeysAndAddress('', publicKey, address);
  }

  isActive () {
    return !!this.m_keyTrio;
  }

  logout () {
    this.m_keyTrio = null;
    this.sessionChange$.next(true);
  }

  observeSessionChange() {
    return this.sessionChange$;
  }

  setKeysAndAddress (privateKey: string, publicKey: string, address: string) {
    this.m_keyTrio = new KeyTrio(privateKey, publicKey, address);
    this.sessionChange$.next(true);
  }

  getTransactions (limit?: number, searchAfter?: string) {
    return this.network.getTransactionsByAddress(this.address, limit, searchAfter);
  }

  validatewerxAddress (address: string) {
    return keyStore.validateWerxAddress(address)
  }

  async getBalance () {
    return this.getBalanceFor(this.address);
  }

  async getBalanceFor (address: string) {
    const addressObj = await this.network.getAddressBalance(address);

    if (addressObj && !isNaN(addressObj.balance)) {
      return new BigNumber(addressObj.balance).multipliedBy(WERX_DECIMALS).toNumber();
    }

    return 0;
  }

  async getFeeRecommendation () {
    //Get last tx ref
    const lastRef = (await this.network.getAddressLastAcceptedTransactionRef(this.address)) as any;

    const hash = lastRef.prevHash || lastRef.hash; // v1 vs v2 format

    if (!hash) {
      return 0;
    }

    //Check for pending TX
    const lastTx = await this.network.getPendingTransaction(hash);
    if (!lastTx) {
      return 0;
    }

    return 1 / WERX_DECIMALS;
  }

  async generateSignedTransaction (toAddress: string, amount: number, fee = 0, lastRef?): Promise< PostTransactionV2>  {
    lastRef = lastRef ? lastRef : await this.network.getAddressLastAcceptedTransactionRef(this.address);

    return keyStore.generateTransactionV2(amount, toAddress, this.keyTrio, lastRef as any, fee);
  }

  async generateSignedTransactionWithHash (toAddress: string, amount: number, fee = 0, lastRef?): Promise<{ transaction: PostTransactionV2, hash: string}>  {
    lastRef = lastRef ? lastRef : await this.network.getAddressLastAcceptedTransactionRef(this.address);

    return keyStore.generateTransactionWithHashV2(amount, toAddress, this.keyTrio, lastRef as any, fee);
  }

  async transferWerx (toAddress: string, amount: number, fee = 0, autoEstimateFee = false): Promise<PendingTx> {
    let normalizedAmount = Math.floor(new BigNumber(amount).multipliedBy(WERX_DECIMALS).toNumber());
    const lastRef: any = await this.network.getAddressLastAcceptedTransactionRef(this.address);

    if (fee === 0 && autoEstimateFee) {
      const tx = await this.network.getPendingTransaction(lastRef.prevHash || lastRef.hash);

      if (tx) {
        const addressObj = await this.network.getAddressBalance(this.address);

        //Check to see if sending max amount
        if (addressObj.balance === normalizedAmount) {
          amount -= WERX_DECIMALS
          normalizedAmount--;
        }

        fee = WERX_DECIMALS;
      }
    }

    const tx = await this.generateSignedTransaction(toAddress, amount, fee);
    const txHash = await this.network.postTransaction(tx);

    if (txHash) {
      return { 
        timestamp: Date.now(), 
        hash: txHash, 
        amount: amount, 
        receiver: toAddress, 
        fee, 
        sender: this.address, 
        ordinal: lastRef.ordinal, 
        pending: true, 
        status: 'POSTED' 
      } ;
    }
  }

  async waitForCheckPointAccepted (hash: string) {
    // In V2 the txn is accepted as it's processed so we don't need to check multiple times
    let txn;
      try {
        txn = await this.network.getPendingTransaction(hash) as any;
      } catch(err: any) { 
        // 404 NOOP
      }

      if (txn && txn.status === 'Waiting') {
        return true;
      }

      try {
        await this.network.getTransaction(hash);
      } catch(err: any) { 
        // 404s if not found
        return false;
      }

      return true
  }

  async waitForBalanceChange (initialValue?: number) {

    if (initialValue === undefined) {
      initialValue = await this.getBalance();
      await this.wait(5);
    }

    let changed = false;

    //Run for a max of 2 minutes (5 * 24 times)
    for (let i = 1; i < 24; i++) {
      const result = await this.getBalance();

      if (result !== undefined) {
        if(result !== initialValue) {
          changed = true;
          break;
        }
      }

      await this.wait(5);
    }

    return changed;
  }

  private wait (time = 5): Promise<void> {
   return new Promise(resolve => setTimeout(resolve, time * 1000));
  }

  // 2.0+ only
  async generateBatchTransactions(transfers: TransferBatchItem[], lastRef?: TransactionReference) {
    if (!lastRef) {
      lastRef = await this.network.getAddressLastAcceptedTransactionRef(this.address) as TransactionReference;
    }

    const txns = [];
    for (const transfer of transfers) {
      const { transaction, hash } = await this.generateSignedTransactionWithHash(transfer.address, transfer.amount, transfer.fee, lastRef);

      lastRef = {
        hash,
        ordinal: lastRef.ordinal + 1
      }
      
      txns.push(transaction);
    }

    return txns;
  }

  async sendBatchTransactions(transactions: PostTransactionV2[]) {

    const hashes = [];
    for (const txn of transactions) {
      const hash = await this.network.postTransaction(txn);

      hashes.push(hash);
    }

    return hashes;
  }

  async transferWerxBatch(transfers: TransferBatchItem[], lastRef?: TransactionReference) {
    const txns = await this.generateBatchTransactions(transfers, lastRef);

    return this.sendBatchTransactions(txns);
  }
}

type TransferBatchItem = {
  address: string,
  amount: number,
  fee?: number
}
