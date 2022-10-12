
# werx.JS - werx JavaScript SDK

This is the werx [JavaScript SDK][docs] for werx Hypergraph Network.

Please read the [documentation][docs] for more detailed instructions. The following includes basic install and configuration.

## Installation

### Node

```bash
npm install @estar-solutions/werx
```

### Yarn

```bash
yarn add @estar-solutions/werx
```

## Usage

### Interacting with wallets

Create a private key
```js
const pk = werx.keyStore.generatePrivateKey();
```

Login with the private key
```js
werx.account.loginPrivateKey(pk);
```

Check werx address
```js
const address = werx.account.address;
```

### Connecting to the network
```js
import { werx } from '@estar-solutions/werx';

// Connect to default network endpoints
werx.account.connect({
    testnet: true
})

// Or provide specific configuration
// L0/L1 urls can point to a specific node
werx.account.connect({
    beUrl: 'http://54.235.210.75:2050',
    l0Url: 'http://20.249.7.13:9000',
    l1Url: 'http://20.194.5.191:9000'
})
```

Check address balance
```js
// Get an address balance
const balance = await werx.network.getAddressBalance('werxabc123...');
```

Get address last reference
```js
werx.network.getAddressLastAcceptedTransactionRef('werxabc123...');
```


### Sending transactions
werx.js supports both online and offline transaction signing as well as bulk transaction sending. You must be logged in with a pk and connected to the network to send transactions. 

Send a single transaction
```js
const toAddress = 'werxabc123...';
const amount = 25.551;
const fee = 0;

werx.account.transferwerx(toAddress, amount, fee);
```

Send bulk transactions
```js
const transfers = [
    {address: 'werxabc123...', amount: 0.000123, fee: 0},
    {address: 'werxabc124...', amount: 0.000124, fee: 0},
    {address: 'werxabc125...', amount: 0.000125, fee: 0},
    {address: 'werxabc126...', amount: 0.000126, fee: 0},
    {address: 'werxabc127...', amount: 0.000127, fee: 0},
    {address: 'werxabc128...', amount: 0.000128, fee: 0.00000001}
];

  const hashes = await werx.account.transferwerxBatch(transfers);
```

Sign transactions offline, then send online
```js
// First get the last txn reference, this can also be retrieved from an offline source
const lastRef = await werx.network.getAddressLastAcceptedTransactionRef('werxWalletSendingAddress');

const transfers = [
    {address: 'werxabc123...', amount: 0.000123, fee: 0},
    {address: 'werxabc124...', amount: 0.000124, fee: 0}
];

const txns = await werx.account.generateBatchTransactions(transfers, lastRef);

// Send online when ready
const hashes = await werx.account.sendBatchTransactions(txns);
```

### Checking transaction status
When a transaction is sent to the network and is accepted, the response will return a hash that can be used to monitor the status of the transaction.

The transaction will initially be in a "waiting" state before it's included in a block and sent to a snapshot. While in this state you can check its status with the L1 API. Once processed by the network, the transaction will no longer be found via the L1 API and will be found in the block explorer API. At this point the transaction is considered final.

The following process can be used to confirm a transaction has been processed and reached a successful final state.

```js
// Send transaction
const hash = await werx.network.postTransaction(txn);

// Keep checking the transaction status until this returns null
const pendingTx = await werx.network.getPendingTransaction(txHash);

// Check that the transaction has registered on the block explore API
if (pendingTx === null) {
  const confirmedTx = await werx.network.getTransaction(txHash);

  if (confirmedTx) {
    // Txn is confirmed - from this point the state cannot be changed
    console.log('Transaction confirmed');
  } else {
    // The txn cannot be found on block explorer. It's a good idea to wait several seconds and try again to confirm the txn has actually been dropped
    console.log('Transaction dropped - not confirmed');
  }
}
```

Migrate all calls to specific APIs to use werx.network
```js
await werx.network.getAddressLastAcceptedTransactionRef('werxabc123');
```

Use werx.account as much as possible
```js
await werx.account.generateSignedTransaction(...);
```

## Documentation

Documentation can be found at [Wiki][docs].

## Building

Build the werx.js package:

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