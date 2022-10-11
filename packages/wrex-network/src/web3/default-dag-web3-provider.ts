import {BlockExplorerV2Api} from "../api";
import {NetworkInfo} from "../types";
import {globalWrexNetwork} from "../global-wrex-network";
import { L0Api } from '../api/v2/l0-api';
import { L1Api } from '../api/v2/l1-api';
import {TransactionV2} from "../dto/v2";

export class DefaultWrexWeb3Provider {

    private blockExplorerApi = new BlockExplorerV2Api();
    private l0Api = new L0Api();
    private l1Api = new L1Api();
    private connectedNetwork: NetworkInfo;

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
            return this.connectedNetwork;
        }
    }

    setNetwork(netInfo: NetworkInfo) {
        if (this.connectedNetwork !== netInfo) {

            this.connectedNetwork = netInfo;

            if (!this.blockExplorerApi) {
                this.blockExplorerApi = new BlockExplorerV2Api();
            }

            this.blockExplorerApi.config().baseUrl(netInfo.beUrl);
        }
    }

    async getBalance(address: string) {
        const balObj = await this.l0Api.getAddressBalance(address);
        return balObj.balance;
    }

    async getTransactionCount(address: string) {
        const balObj = await this.l1Api.getAddressLastAcceptedTransactionRef(address);
        return balObj.ordinal;
    }

    async getTransactionHistory (address: string, limit = 100): Promise<TransactionV2[]> {
        return this.getBlockExplorerApi().getTransactionsByAddress(address, limit);
    }

    async getTokenTransactionHistory (address: string, limit = 100): Promise<TransactionV2[]> {
        return [];
    }

    async getTokenAddressBalances (addresses: string[], tokenContractAddress?: string[]) {
        return {};
    }

    private getBlockExplorerApi() {
        return this.blockExplorerApi || globalWrexNetwork.blockExplorerApi;
    }

}