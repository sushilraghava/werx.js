
const fetch = require('node-fetch');
const {PendingTx} = require("@wrex/wrex-network");
const { LocalStorage } = require('node-localstorage');
const {WrexAccount} = require("../dist/cjs/wrex-account");
const {WrexMonitor} = require("../dist/cjs/wrex-monitor");
const {wrexDi} = require("@wrex/wrex-core");

wrexDi.useFetchHttpClient(fetch);
wrexDi.useLocalStorageClient(new LocalStorage('./scratch'));

//https://us-central1-dag-faucet.cloudfunctions.net/main/api/v1/faucet/main/DAG1J38gQDYfHUVSAnuygPsbk2FoH3Kt2yaN1bKu?amount=0.001
// const FAUCET_URL = 'https://us-central1-dag-faucet.cloudfunctions.net/main/api/v1/faucet/main/'
const wrexAccount = new WrexAccount();
const wrexMonitor = new WrexMonitor(wrexAccount);

function login() {
    wrexAccount.loginPrivateKey('d8e6cb2639e5a808a94d758061b3774cd1128d918a7d96ae497f8ff4fdb154c0');
}

async function testFee () {

    login();

    const fee = await wrexAccount.getFeeRecommendation();

    console.log(fee);
}

async function testLocalStorage () {
    const storage = wrexDi.getStateStorageDb();

    //storage.set('hello', 'world');

    const value = storage.get('hello');

    console.log(value);
}

async function testFaucet () {

    login();

    const faucetApi = wrexDi.createRestApi(FAUCET_URL);

    const pendingTx = await faucetApi.$get(wrexAccount.address, { amount: 1/1e4 });

    console.log(JSON.stringify(pendingTx,null,2));

    if (!pendingTx || !pendingTx.amount) {
        console.log('Already request in 24 hrs');
    } else {
        wrexMonitor.addToMemPoolMonitor(pendingTx);
        console.log(`Received ${pendingTx.amount / 1e8} WREX`);
    }

    wrexMonitor.observeMemPoolChange().subscribe((monitorUpdate) => {
        console.log(JSON.stringify(monitorUpdate,null,2));
    });
}

/*
export type WrexWalletMonitorUpdate = {
  pendingHasConfirmed: boolean;
  transTxs: PendingTx[];
  txChanged: boolean;
}
 */
async function monitorTx () {
    login();

    wrexMonitor.observeMemPoolChange().subscribe((monitorUpdate) => {
        const status = {
            txChanged: monitorUpdate.txChanged,
            pendingHasConfirmed: monitorUpdate.pendingHasConfirmed,
            tx:{
                pendingMsg: monitorUpdate.transTxs[0]?.pendingMsg, pending: monitorUpdate.transTxs[0]?.pending
            }
        }
        console.log(JSON.stringify(status,null,2));
    });

    wrexMonitor.startMonitor();
}

//testFee();
// testLocalStorage();
//testFaucet();
monitorTx();
