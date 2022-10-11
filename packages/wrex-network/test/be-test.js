const {WrexNetwork} = require("../dist/cjs");

const {wrexDi} = require("@wrex/wrex-core");
const fetch = require('node-fetch');

wrexDi.useFetchHttpClient(fetch);

async function test () {
    //http://54.235.210.75:3000/search?term=WREX2rMPHX4w1cMMjowmewRMjD1in53yRURt6Eijh
    const d = new Date();
    //d.setMinutes(d.getMinutes() - 1);

    console.log(d);
    console.log(d.toLocaleTimeString());

    const network = new WrexNetwork();

    network.config({
        id: 'ceres',
        beUrl: 'http://54.235.210.75:2050',
        l0Url: 'http://20.249.7.13:9000'
    })

    const results = await network.blockExplorerApi.getTransactionsByAddress('WREX3buDiD1WVT1Z8q3hDGMiWJYbnJEZv8WCeSmHc', 1);//0, "2020-12-24T01:57:00Z")

    console.log(JSON.stringify(results,null,' '));

    console.log(results.length);
}

test();
