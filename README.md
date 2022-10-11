
# WREX.JS - WREX JavaScript SDK

This is the WREX [JavaScript SDK][docs] for WREX Hypergraph Network.

Please read the [documentation][docs] for more detailed instructions. The following includes basic install and configuration.

## Installation

### Node

```bash
npm install @wrex/wrex
```

### Yarn

```bash
yarn add @wrex/wrex
```

## Usage

### Interacting with wallets

Create a private key
```js
const pk = wrex.keyStore.generatePrivateKey();
```

Login with the private key
```js
wrex.account.loginPrivateKey(pk);
```

Check WREX address
```js
const address = wrex.account.address;
```

### Connecting to the network
```js
import { wrex } from '@wrex/wrex';

// Connect to default network endpoints
wrex.account.connect({
    networkVersion: '2.0',
    testnet: true
})

// Or provide specific configuration
// L0/L1 urls can point to a specific node
wrex.account.connect({
    networkVersion: '2.0',
    beUrl: 'http://54.235.210.75:2050',
    l0Url: 'http://20.249.7.13:9000',
    l1Url: 'http://20.194.5.191:9000'
})
```

Check address balance
```js
// Get an address balance
const balance = await wrex.network.getAddressBalance('WREXabc123...');
```

Get address last reference
```js
wrex.network.getAddressLastAcceptedTransactionRef('WREXabc123...');
```


### Sending transactions
wrex.js supports both online and offline transaction signing as well as bulk transaction sending. You must be logged in with a pk and connected to the network to send transactions. 

Send a single transaction
```js
const toAddress = 'WREXabc123...';
const amount = 25.551;
const fee = 0;

wrex.account.transferWrex(toAddress, amount, fee);
```

Send bulk transactions
```js
const transfers = [
    {address: 'WREXabc123...', amount: 0.000123, fee: 0},
    {address: 'WREXabc124...', amount: 0.000124, fee: 0},
    {address: 'WREXabc125...', amount: 0.000125, fee: 0},
    {address: 'WREXabc126...', amount: 0.000126, fee: 0},
    {address: 'WREXabc127...', amount: 0.000127, fee: 0},
    {address: 'WREXabc128...', amount: 0.000128, fee: 0.00000001}
];

  const hashes = await wrex.account.transferWrexBatch(transfers);
```

Sign transactions offline, then send online
```js
// First get the last txn reference, this can also be retrieved from an offline source
const lastRef = await wrex.network.getAddressLastAcceptedTransactionRef('WREXWalletSendingAddress');

const transfers = [
    {address: 'WREXabc123...', amount: 0.000123, fee: 0},
    {address: 'WREXabc124...', amount: 0.000124, fee: 0}
];

const txns = await wrex.account.generateBatchTransactions(transfers, lastRef);

// Send online when ready
const hashes = await wrex.account.sendBatchTransactions(txns);
```

### Checking transaction status
When a transaction is sent to the network and is accepted, the response will return a hash that can be used to monitor the status of the transaction.

The transaction will initially be in a "waiting" state before it's included in a block and sent to a snapshot. While in this state you can check its status with the L1 API. Once processed by the network, the transaction will no longer be found via the L1 API and will be found in the block explorer API. At this point the transaction is considered final.

The following process can be used to confirm a transaction has been processed and reached a successful final state.

```js
// Send transaction
const hash = await wrex.network.postTransaction(txn);

// Keep checking the transaction status until this returns null
const pendingTx = await wrex.network.getPendingTransaction(txHash);

// Check that the transaction has registered on the block explore API
if (pendingTx === null) {
  const confirmedTx = await wrex.network.getTransaction(txHash);

  if (confirmedTx) {
    // Txn is confirmed - from this point the state cannot be changed
    console.log('Transaction confirmed');
  } else {
    // The txn cannot be found on block explorer. It's a good idea to wait several seconds and try again to confirm the txn has actually been dropped
    console.log('Transaction dropped - not confirmed');
  }
}
```

Migrate all calls to specific APIs to use wrex.network
```js
await wrex.network.getAddressLastAcceptedTransactionRef('WREXabc123');
```

Use wrex.account as much as possible
```js
await wrex.account.generateSignedTransaction(...);
```

## Documentation

Documentation can be found at [Wiki][docs].

## Building

Build the wrex.js package:

```bash
npm run build
```

### Testing (mocha)

```bash
npm test --workspaces
```

---
### License
[![License: GPL v3](https://img.shields.io/badge/License-MIT-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
This project is licensed under the terms of the **MIT** license.