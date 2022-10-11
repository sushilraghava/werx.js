
import {BlockExplorerV2Api, blockExplorerApi} from './api/v2/block-explorer-api';
import {WrexNetwork} from './wrex-network';

export class GlobalWrexNetwork extends WrexNetwork {

  blockExplorerApi = blockExplorerApi;

  blockExplorer (host: string) {
    return new BlockExplorerV2Api(host);
  }
}

export const globalWrexNetwork = new GlobalWrexNetwork();


